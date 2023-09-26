import IsoContext from "./IsoContext.js";
import {render as renderToString} from "preact-render-to-string";
import {createElement} from "preact/compat";
import {RouterProvider} from "../components/router.js";
import {IsoIdNamespace} from "../components/useIsoId.js";

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
	constructor(root, req, {localFetch, props, clientPathname, setGlobalLocation}) {
		this.req=req;
		this.localFetch=localFetch;
		this.clientPathname=clientPathname;
		this.promises={};
		this.data={};
		this.deps={};
		this.barriers={};
		this.props=props;
		this.setGlobalLocation=setGlobalLocation;
		this.refs={};
		this.serverRefs={};

		if (typeof this.props=="function")
			this.props=this.props(req);

		this.element=createElement(
			IsoContext.Provider,
			{value: this},
			createElement(
				IsoIdNamespace,
				{name: "root"},
				createElement(
					RouterProvider,
					{url: req.url},
					createElement(root,this.props)
				)
			)
		);
	}

	getServerRef=(id, initial)=>{
		if (!this.serverRefs[id]) {
			this.serverRefs[id]={
				current: initial
			}
		}

		return this.serverRefs[id];
	}

	getIsoRef=(id, initial)=>{
		if (!this.refs[id])
			this.refs[id]={
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
		//console.log("waiting...");
		for (let id in this.promises)
			this.data[id]=await this.promises[id];

		for (let id in this.barriers) {
			//console.log("waiting for completion: "+id);
			await this.barriers[id].promise;
		}

		//console.log("done waiting...");
	}

	hasPromises() {
		if (Object.keys(this.promises).length>
				Object.keys(this.data).length)
			return true;

		for (let id in this.barriers)
			if (!this.barriers[id].isResolved())
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