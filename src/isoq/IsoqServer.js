import {render as renderToString} from "preact-render-to-string";
import React from "preact/compat";
import Browser from "@browser";
import clientSource from "@clientSource";
import {createElement} from "react";
import {IsoContext} from "../components/isomorphic.js";

export default class IsoqServer {
	async handleRequest(req, localFetch) {
		if (new URL(req.url).pathname=="/client.js"
				&& clientSource) {
			return new Response(clientSource,{
				headers: {
					"Content-Type": "text/javascript"
				}
			});
		}

		let head="";
		let renderResult;
		let isoContext=new IsoContext();

		function doRenderPass() {
			global.__headChildren=undefined;
			global.location=new URL(req.url);
			global.__localFetch=localFetch;
			renderResult=isoContext.with(()=>renderToString(createElement(Browser)));
			if (global.__headChildren)
				head=renderToString(global.__headChildren);
		}

		doRenderPass();
		if (isoContext.hasPromises()) {
			await isoContext.wait();
			doRenderPass();
		}

		if (!renderResult)
			return;

		let content=`
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
					<script>window.__isoData=${JSON.stringify(isoContext.data)}</script>
					<script src="/client.js" type="module"></script>
				</body>
			</html>
		`;

		return new Response(content,{
			headers: {
				"Content-Type": "text/html"
			}
		});
	}
}