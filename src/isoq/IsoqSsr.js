import IsoContext from "./IsoContext.js";
import {render as renderToString} from "preact-render-to-string";
import {createElement} from "preact/compat";
import DefaultErrorFallback from "./DefaultErrorFallback.js";
import {IsoErrorBoundary} from "../components/IsoErrorBoundary.js";
import {parseCookie, stringifyCookie} from "../utils/js-util.js";
import SourceMapperNode from "isoq/source-mapper-node";
import Barrier from "./Barrier.js";
import urlJoin from "url-join";

export default class IsoqSsr {
	constructor(root, req, {localFetch, props, clientPathname, appPathname}) {
		this.root=root;
		this.req=req;
		this.localFetch=localFetch;
		this.clientPathname=clientPathname;
		this.appPathname=appPathname;
		this.refs={};
		this.barriers={};
		this.props=props;

		this.cookies={};
		let parsedCookies=parseCookie(req.headers.get("cookie"));
		for (let k in parsedCookies)
			this.cookies[k]={value: parsedCookies[k]};

		this.cookieDispatcher=new EventTarget();
	}

	setErrorFallback(fallback) {
		this.errorFallback=fallback;
	}

	setError(error) {
		this.error=error;
	}

	getIsoRef=(id, initial)=>{
		if (!this.refs[id])
			this.refs[id]={
				//id: id, // remove!!
				current: initial
			};

		return this.refs[id];
	}

	getBarrier=(id)=>{
		if (!this.barriers[id])
			this.barriers[id]=new Barrier(id);

		return this.barriers[id].resolve;
	}

	unresolveBarrier(barrierResolver) {
		if (!barrierResolver.barrierId)
			throw new Error("Not a barrier");

		let id=barrierResolver.barrierId;
		let barrier=this.barriers[id];

		//console.log("unresolving: "+barrier.id);
		barrier.unresolve();
	}

	redirect(targetUrl) {
		let headers=this.getCookieHeaders();
		headers.set("location",targetUrl);
		this.response=new Response("Moved",{
			status: 302,
			headers: headers
		});
	}

	getUrl() {
		return this.req.url;
	}

	getAppUrl(path) {
		if (!path)
			path="";

		let u=new URL(urlJoin(this.appPathname,path),this.getUrl());

		return u.toString();
	}

	fetch=async (url, options={})=> {
		if (url.startsWith("/")) {
			url=new URL(this.req.url).origin+url;
			let req=new Request(url.toString(),options);

			if (this.req.headers.get("cookie"))
				req.headers.set("cookie",this.req.headers.get("cookie"));

			let localFetchResponse=await this.localFetch(req);
			if (localFetchResponse.status!=200) {
				console.log("****** local fetch failed");
				//console.log("local fetch request: ",req);
				//console.log("local fetch request: ",localFetchResponse);
			}

			return localFetchResponse;
		}

		return await fetch(url,options);
	}

	isSsr() {
		return true;
	}

	async wait() {
		if (this.error)
			throw this.error;

		for (let id in this.barriers) {
			await this.barriers[id].promise;
		}

		if (this.error)
			throw this.error;
	}

	hasPromises() {
		if (this.error)
			throw this.error;

		for (let id in this.barriers)
			if (!this.barriers[id].isResolved())
				return true;

		return false;
	}

	async renderError() {
		let e=this.error;

		if (globalThis.__ISOQ_OPTIONS.sourcemap) {
			let mapper=new SourceMapperNode(globalThis.__ISOQ_OPTIONS.sourcemapFile);
			e=await mapper.transformError(e);
		}

		console.error(e.stack);

		let errorContent=renderToString(
			createElement(this.errorFallback,{error:e})
		);		

		return `<!DOCTYPE html>
			<html>
				<head>
					<title>Error</title>
				</head>
				${errorContent}
			</html>`;

	}

	async render() {
		let props=this.props;
		if (typeof props=="function")
			props=await props(this.req);

		if (!props)
			props={};

		//console.log("rendering with props: ",props);

		this.element=
			createElement(IsoContext.Provider,{value: this},
				createElement(IsoErrorBoundary,{fallback: DefaultErrorFallback},
					createElement(this.root,props)
				)
			);

		let renderResult,head;
		this.headChildren=[];

		try {
			//console.log("running prepass...");
			//await prepass(this.element);
			this.headChildren=[];
			//console.log("running renderToString...");
			renderResult=renderToString(this.element);

			while (this.hasPromises()) {
				await this.wait();
				//console.log("running prepass...");
				//await prepass(this.element);
				this.headChildren=[];
				//console.log("running renderToString...");
				renderResult=renderToString(this.element);
			}

			head=renderToString(this.headChildren);
		}

		catch (e) {
			this.error=e;
			return await this.renderError();
		}

		let sourceMapScripts="";
		if (globalThis.__ISOQ_OPTIONS.sourcemap) {
			sourceMapScripts=`
				<script src="https://unpkg.com/source-map@0.7.3/dist/source-map.js"></script>
				<script>
				  sourceMap.SourceMapConsumer.initialize({
				    "lib/mappings.wasm": "https://unpkg.com/source-map@0.7.3/lib/mappings.wasm",
				  });
				</script>
				<script>window.__sourcemapRoot=${JSON.stringify(globalThis.__ISOQ_OPTIONS.sourcemapRoot)}</script>
			`;
		}

		let refs={};
		for (let k in this.refs) {
			if (this.refs[k].current && this.refs[k].shared)
				refs[k]={current: this.refs[k].current};
		}

		let iso={
			props: props,
			refs: refs,
			appPathname: this.appPathname
		}

		return `<!DOCTYPE html>
			<html style="height: 100%">
				<head>
					${sourceMapScripts}
					<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
					<meta charset="utf-8"/>
					${head}
				</head>
				<body style="margin: 0; height: 100%">
					<div id="isoq" style="height: 100%">
						${renderResult}
					</div>
					<script>window.__iso=${JSON.stringify(iso)}</script>
					<script src="${this.getAppUrl(this.clientPathname)}" type="module"></script>
				</body>
			</html>
		`;
	}

	async getResponse() {
		let content=await this.render();
		if (this.response)
			return this.response;

		if (!content)
			return;

		let h=this.getCookieHeaders();
		h.set("content-type","text/html");

		return new Response(content,{headers: h});
	}

	getCookieHeaders() {
		let h=new Headers();
		for (let k in this.cookies)
			if (this.cookies[k].modified)
				h.append("set-cookie",stringifyCookie(k,this.cookies[k].value,this.cookies[k]))

		return h;
	}

	getCookie(key) {
		if (this.cookies[key])
			return this.cookies[key].value;
	}

	setCookie(key, value, options={}) {
		this.cookies[key]={value, modified: true, ...options};
		this.cookieDispatcher.dispatchEvent(new Event(key));
	}

	getWindow() {
	}
}