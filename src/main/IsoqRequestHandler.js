import {renderToString} from "preact-render-to-string";

export default class IsoqRequestHandler {
	constructor({clientModule, clientSource, inlineBundle, fs}) {
		this.clientModule=clientModule;
		this.clientSource=clientSource;
		this.inlineBundle=inlineBundle;
		this.fs=fs;
	}

	handleRequest=async (request, options={})=>{
		let u=new URL(request.url);
		if (u.pathname=="/favicon.ico") {
			return new Response("");
		}

		if (u.pathname=="/client-bundle.js" &&
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
			localFetch: options.localFetch,
			fs: this.fs,
			request: request
		});

		let content,head="",scriptTag="";

		try {
			content=await this.clientModule.ssrRender({isoState});
			head=renderToString(isoState.headChildren);
			scriptTag=`<script type="module" src="/client.js"></script>`;
			if (this.inlineBundle)
				scriptTag=`<script>${this.clientSource}</script>`;

			else if (this.clientSource)
				scriptTag=`<script type="module" src="/client-bundle.js"></script>`;

			if (isoState.routerState.redirectUrl) {
				let headers=new Headers();
				headers.set("location",isoState.routerState.redirectUrl);
				return new Response("Moved",{
					status: 302,
					headers: headers
				});

				// Todo... handle cookies...
				/*if (routerState.redirectUrl) {
					let headers=this.getCookieHeaders();
					headers.set("location",routerState.redirectUrl);
					this.response=new Response("Moved",{
						status: 302,
						headers: headers
					});

					return;
				}*/
			}
		}

		catch (error) {
			console.log(error);

			await isoState.processError(error);
			content=await this.clientModule.ssrRenderError({isoState, error});
		}

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