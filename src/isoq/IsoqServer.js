import React from "preact/compat";
import {createElement} from "preact/compat";
import IsoqSsr from "./IsoqSsr.js";
import {render as renderToString} from "preact-render-to-string";
import favicon from "./favicon.js";
import {splitPath, jsonEq} from "../utils/js-util.js";

export default class IsoqServer {
	constructor({clientModule, clientSource, clientSourceMap}) {
		this.clientModule=clientModule;
		this.clientSource=clientSource;
		this.clientSourceMap=clientSourceMap;
	}

	async handleRequest(req, options={}) {
		let {localFetch, props, clientPathname, appPathname}=options;

		if (!appPathname)
			appPathname="/";

		if (!clientPathname) {
			if (this.clientSource)
				clientPathname="/bundled-client.js";

			else
				clientPathname="/client.js";
		}

		let pathname=new URL(req.url).pathname;
		if (req.method.toUpperCase()!="GET")
			return;

		let appPathnameParts=splitPath(appPathname);
		let clientPathnameParts=splitPath(clientPathname);
		let clientMapPathnameParts=splitPath(clientPathname+".map");
		let pathnameParts=splitPath(pathname);
		let prefixParts=pathnameParts.splice(0,appPathnameParts.length);
		if (!jsonEq(prefixParts,appPathnameParts))
			return;

		if (jsonEq(pathnameParts,clientPathnameParts) && this.clientSource) {
			return new Response(this.clientSource,{
				headers: {
					"Content-Type": "text/javascript",
					"Access-Control-Allow-Origin": "*"
				}
			});
		}

		if (jsonEq(pathnameParts,clientMapPathnameParts) && this.clientSourceMap) {
			return new Response(this.clientSourceMap,{
				headers: {
					"Content-Type": "application/json"
				}
			});
		}

		if (jsonEq(pathnameParts,["favicon.ico"])) {
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

		let ssr=new IsoqSsr(this.clientModule,req,{
			localFetch,
			props,
			clientPathname,
			appPathname: "/"+appPathnameParts.join("/")
		});

		return await ssr.getResponse();
	}
}