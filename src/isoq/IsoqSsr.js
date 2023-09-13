import IsoContext from "./IsoContext.js";
import {render as renderToString} from "preact-render-to-string";
import {createElement} from "react";

export default class IsoqSsr {
	constructor(root, req, localFetch, props) {
		this.req=req;
		this.localFetch=localFetch;
		this.promises={};
		this.data={};
		this.props=props;
		if (typeof this.props=="function")
			this.props=this.props(req);

		this.element=createElement(
			IsoContext.Provider,
			{value: this},
			createElement(root,this.props)
		);
	}

	getUrl() {
		return this.req.url;
	}

	async fetch(url, options={}) {
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
					<script src="/client.js" type="module"></script>
				</body>
			</html>
		`;
	}
}