import IsoContext from "./IsoContext.js";
import {render as renderToString} from "preact-render-to-string";
import {createElement} from "preact/compat";

export default class IsoqSsr {
	constructor(root, req, {localFetch, props, clientPathname}) {
		this.req=req;
		this.localFetch=localFetch;
		this.clientPathname=clientPathname;
		this.promises={};
		this.data={};
		this.deps={};
		this.props=props;
		if (typeof this.props=="function")
			this.props=this.props(req);

		this.element=createElement(
			IsoContext.Provider,
			{value: this},
			createElement(root,this.props)
		);
	}

	redirect(targetUrl) {
		let headers=new Headers();
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
			let req=new Request(url,options);
			return await this.localFetch(req);
		}

		return await fetch(url,options);
	}

	isSsr() {
		return true;
	}

	async wait() {
		for (let id in this.promises)
			this.data[id]=await this.promises[id];
	}

	hasPromises() {
		return (Object.keys(this.promises).length>Object.keys(this.data).length);
	}

	renderPass() {
		this.headChildren="";
		global.location=new URL(this.req.url);
		return renderToString(this.element);
	}

	async render() {
		let renderResult=this.renderPass();
		while (this.hasPromises()) {
			await this.wait();
			renderResult=this.renderPass();
		}

		let head=renderToString(this.headChildren);

		return `
			<!DOCTYPE html>
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
					<script>window.__isoProps=${JSON.stringify(this.props)}</script>
					<script>window.__isoData=${JSON.stringify(this.data)}</script>
					<script>window.__isoDeps=${JSON.stringify(this.deps)}</script>
					<script src="${this.clientPathname}" type="module"></script>
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

		return new Response(content,{
			headers: {
				"Content-Type": "text/html"
			}
		});
	}
}