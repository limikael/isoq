import IsoContext from "./IsoContext.js";
import {render as renderToString} from "preact-render-to-string";
//import prepass from "preact-ssr-prepass";
import {createElement} from "preact/compat";
import {RouterProvider} from "../components/router.js";
import {IsoIdNamespace, IsoIdRoot} from "../components/useIsoId.js";
import DefaultErrorFallback from "./DefaultErrorFallback.js";
import {IsoErrorBoundary} from "../components/IsoErrorBoundary.js";
import {parseCookie, stringifyCookie} from "../utils/js-util.js";
import favicon from "./favicon.js";

class Barrier {
	constructor(id) {
		this.resolved=false;
		this.promise=new Promise(resolve=>{
			this.promiseResolver=resolve
		});

		this.id=id;
		this.resolve.barrierId=id;
	}

	resolve=()=>{
		this.resolved=true;
		this.promiseResolver();
	}

	unresolve() {
		this.resolved=false;
		this.promise=new Promise(resolve=>{
			this.promiseResolver=resolve
		});
	}

	isResolved() {
		return this.resolved;
	}
}

export default class IsoqSsr {
	constructor(root, req, {localFetch, props, clientPathname}) {
		this.root=root;
		this.req=req;
		this.localFetch=localFetch;
		this.clientPathname=clientPathname;
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

	fetch=async (url, options={})=> {
		if (url.startsWith("/")) {
			url=new URL(this.req.url).origin+url;
			let req=new Request(url.toString(),options);

			if (this.req.headers.get("cookie"))
				req.headers.set("cookie",this.req.headers.get("cookie"));

			let localFetchResponse=await this.localFetch(req);
			if (localFetchResponse.status!=200) {
				console.log("****** local fetch failed");
				console.log("local fetch request: ",req);
				console.log("local fetch request: ",localFetchResponse);
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

	renderError() {
		return renderToString(
			createElement(this.errorFallback,{error:this.error})
		);		
	}

	stringifyError() {
		if (!this.error)
			return JSON.stringify(null);

		return JSON.stringify({
			message: this.error.message,
			stack: this.error.stack
		});
	}

	async render() {
		let props=this.props;
		if (typeof props=="function")
			props=await props(this.req);

		//console.log("rendering with props: ",props);

		this.element=
			createElement(IsoContext.Provider,{value: this},
				createElement(IsoErrorBoundary,{fallback: DefaultErrorFallback},
					createElement(IsoIdRoot,{name: "root"},
						createElement(RouterProvider,{url: this.req.url},
							createElement(this.root,props)
						)
					)
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
			console.error(e);
			this.error=e;
			return this.renderError();
		}

		//console.log(this.refs);

		for (let k of Object.keys(this.refs)) {
			if (this.refs[k].local)
				delete this.refs[k];
		}

		return `<!DOCTYPE html>
			<html>
				<head>
					<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
					<meta charset="utf-8"/>
					${head}
				</head>
				<body style="margin: 0">
					<div id="isoq">
						${renderResult}
					</div>
					<script>window.__isoError=${this.stringifyError()}</script>
					<script>window.__isoProps=${JSON.stringify(props)}</script>
					<script>window.__isoRefs=${JSON.stringify(this.refs)}</script>
					<script src="${this.clientPathname}" type="module"></script>
				</body>
			</html>
		`;
	}

	async getResponse() {
		let u=new URL(this.req.url);
		if (u.pathname=="/favicon.ico") {
			var byteString = atob(favicon);
			var ab = new ArrayBuffer(byteString.length);
			var ia = new Uint8Array(ab);
			for (var i = 0; i < byteString.length; i++)
			    ia[i] = byteString.charCodeAt(i);

			let blob=new Blob([ab]);
			return new Response(blob,{
				headers: {
					"Content-Type": "image/x-icon"
				}
			});
		}

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
}