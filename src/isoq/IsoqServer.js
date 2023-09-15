import React from "preact/compat";
import Browser from "@browser";
import clientSource from "@clientSource";
import {createElement} from "react";
import IsoqSsr from "./IsoqSsr.js";
import {render as renderToString} from "preact-render-to-string";

export default class IsoqServer {
	async handleRequest(req, localFetch, props) {
		if (new URL(req.url).pathname=="/client.js"
				&& clientSource) {
			return new Response(clientSource,{
				headers: {
					"Content-Type": "text/javascript"
				}
			});
		}

		let ssr=new IsoqSsr(Browser,req,localFetch,props);
		return await ssr.getResponse();
	}
}