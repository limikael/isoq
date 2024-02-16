import React from "preact/compat";
import {createElement} from "preact/compat";
import IsoqSsr from "./IsoqSsr.js";
import {render as renderToString} from "preact-render-to-string";

export default class IsoqServer {
	constructor({clientModule, clientSource, clientSourceMap}) {
		this.clientModule=clientModule;
		this.clientSource=clientSource;
		this.clientSourceMap=clientSourceMap;
	}

	async handleRequest(req, options={}) {
		let {localFetch, props, clientPathname}=options;

		if (!clientPathname)
			clientPathname="/client.js";

		let pathname=new URL(req.url).pathname;
		if (req.method.toUpperCase()!="GET")
			return;

		//console.log("GET: "+pathname);

		if (pathname==clientPathname && this.clientSource) {
			return new Response(this.clientSource,{
				headers: {
					"Content-Type": "text/javascript"
				}
			});
		}

		if (pathname==clientPathname+".map" && this.clientSourceMap) {
			return new Response(this.clientSourceMap,{
				headers: {
					"Content-Type": "application/json"
				}
			});
		}

		let ssr=new IsoqSsr(this.clientModule,req,{
			localFetch,
			props,
			clientPathname,
		});

		return await ssr.getResponse();
	}
}