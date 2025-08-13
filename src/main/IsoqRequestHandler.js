import {renderToString} from "preact-render-to-string";

export default class IsoqRequestHandler {
	constructor({clientModule, clientSource, inlineBundle}) {
		this.clientModule=clientModule;
		this.clientSource=clientSource;
		this.inlineBundle=inlineBundle;
	}

	handleRequest=async (request, options={})=>{
		let u=new URL(request.url);
		if (u.pathname=="/favicon.ico") {
			return new Response("");
		}

		if (u.pathname=="/client.js" &&
				this.clientSource) {
			return new Response(this.clientSource,{
				headers: new Headers({
					"content-type": "application/javascript"
				})
			});
		}

		let isoState=this.clientModule.createIsoState({
			url: u,
			props: options.props,
			localFetch: options.localFetch
		});

		let content=await this.clientModule.ssrRender({isoState});
		let head=renderToString(isoState.headChildren);
		let scriptTag=`<script type="module" src="/client.js"></script>`;
		if (this.inlineBundle)
			scriptTag=`<script>${this.clientSource}</script>`;

		let htmlContent=`<!DOCTYPE html>
			<html style="height: 100%">
				<head>
					<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
					<meta charset="utf-8"/>
					${head}
				</head>
				<body style="margin: 0; height: 100%">
					<div id="isoq" style="display: contents">
						${content}
					</div>
					<script>window.__iso=${JSON.stringify(isoState.getData())}</script>
					${scriptTag}
				</body>
			</html>
		`;

		let headers=new Headers({
			"content-type": "text/html"
		});

		return new Response(htmlContent,{headers});
	}
}