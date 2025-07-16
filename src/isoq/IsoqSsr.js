import IsoContext from "./IsoContext.js";
import {render as renderToString} from "preact-render-to-string";
import {createElement} from "preact/compat";
import DefaultErrorFallback from "./DefaultErrorFallback.js";
import {IsoErrorBoundary} from "../components/IsoErrorBoundary.js";
import {parseCookie, stringifyCookie} from "../utils/js-util.js";
import SourceMapperNode from "isoq/source-mapper-node";
import urlJoin from "url-join";
import {IsoRefState, IsoRefContext} from "../utils/iso-ref.js";
import {renderToStringAsync} from "preact-render-to-string";

export default class IsoqSsr {
	constructor({clientModule, clientSource, req, localFetch, props, clientPathname, appPathname, wrappers}) {
		this.clientModule=clientModule;
		this.clientSource=clientSource;
		this.req=req;
		this.localFetch=localFetch;
		this.clientPathname=clientPathname;
		this.appPathname=appPathname;
		this.props=props;
		this.wrappers=wrappers;

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
		//console.log(this.wrappers);

		let element=createElement(this.clientModule,props);

		for (let w of [...this.wrappers].reverse())
			element=createElement(w,props,element);

		let isoRefState=new IsoRefState();

		element=
			createElement(IsoContext.Provider,{value: this},
				createElement(IsoRefContext.Provider,{value: isoRefState},
					createElement(IsoErrorBoundary,{fallback: DefaultErrorFallback},
						element
					)
				)
			);

		let renderResult,head;
		this.headChildren=[];

		try {
			renderResult=await renderToStringAsync(element);
			head=renderToString(this.headChildren); // FIX it needs to reset between suspense... no it works...
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

		let iso={
			props: props,
			refs: isoRefState.getSharedRefValues(),
			appPathname: this.appPathname
		}

		let scriptTag=`<script src="${this.getAppUrl(this.clientPathname)}" type="module"></script>`;
		if (globalThis.__ISOQ_OPTIONS.inlineBundle)
			scriptTag=`<script>${this.clientSource}</script>`;

		return `<!DOCTYPE html>
			<html style="height: 100%">
				<head>
					${sourceMapScripts}
					<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
					<meta charset="utf-8"/>
					${head}
				</head>
				<body style="margin: 0; height: 100%">
					<div id="isoq" style="display: contents">
						${renderResult}
					</div>
					<script>window.__iso=${JSON.stringify(iso)}</script>
					${scriptTag}
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