import IsoContext from "./IsoContext.js";
import {render as renderToString} from "preact-render-to-string";
import {createElement} from "preact/compat";
import {RouterProvider} from "../components/router.js";

export default class IsoqSsr {
	constructor(root, req, {localFetch, props, clientPathname, setGlobalLocation}) {
		this.req=req;
		this.localFetch=localFetch;
		this.clientPathname=clientPathname;
		this.promises={};
		this.completeNotifiers={};
		this.completePromises={};
		this.completedPromises={};
		this.data={};
		this.deps={};
		this.props=props;
		this.setGlobalLocation=setGlobalLocation;
		this.refs={};

		if (typeof this.props=="function")
			this.props=this.props(req);

		this.element=createElement(
			IsoContext.Provider,
			{value: this},
			createElement(
				RouterProvider,
				{url: req.url},
				createElement(root,this.props)
			)
		);
	}

	getIsoRef=(id, initial)=>{
		if (!this.refs[id])
			this.refs[id]={
				current: initial
			};

		return this.refs[id];
	}

	getCompleteNotifier=(id)=>{
		if (!this.completeNotifiers[id]) {
			let resolver;
			this.completePromises[id]=new Promise(resolve=>{
				resolver=resolve;
			});

			this.completeNotifiers[id]=()=>{
				this.completedPromises[id]=this.completePromises[id];
				resolver();
			};
		}

		return this.completeNotifiers[id];
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

		for (let id in this.completePromises)
			await this.completePromises[id];
	}

	hasPromises() {
		if (Object.keys(this.promises).length>
				Object.keys(this.data).length)
			return true;

		if (Object.keys(this.completePromises).length>
				Object.keys(this.completedPromises).length)
			return true;

		return false;
	}

	registerEffect(fn) {
		this.effects.push(fn);
	}

	renderPass() {
		this.headChildren="";
		this.effects=[];

		if (this.setGlobalLocation)
			global.location=new URL(this.req.url);

		let result=renderToString(this.element);
		for (let effect of this.effects) {
			let cleanup=effect();
			if (cleanup)
				cleanup();
		}

		return result;
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
					<script>window.__isoRefs=${JSON.stringify(this.refs)}</script>
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