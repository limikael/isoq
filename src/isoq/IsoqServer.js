import React from "preact/compat";
import {createElement} from "preact/compat";
import IsoqSsr from "./IsoqSsr.js";
import {render as renderToString} from "preact-render-to-string";

export default class IsoqServer {
	constructor({clientModule, clientSource}) {
		this.clientModule=clientModule;
		this.clientSource=clientSource;
	}

	async handleRequest(req, {localFetch, props, clientPathname, setGlobalLocation}) {
		if (!clientPathname)
			clientPathname="/client.js";

		if (new URL(req.url).pathname==clientPathname
				&& this.clientSource) {
			return new Response(this.clientSource,{
				headers: {
					"Content-Type": "text/javascript"
				}
			});
		}

		let ssr=new IsoqSsr(this.clientModule,req,{
			localFetch,
			props,
			clientPathname,
			setGlobalLocation
		});

		return await ssr.getResponse();
	}
}