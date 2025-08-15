import {createContext} from "preact";
import {useContext} from "preact/hooks";
import {IsoRefContext} from "./iso-ref.js";
import {Router} from "./router.jsx";
import {IsoRefState} from "./iso-ref.js";
import {RouterState} from "./router.jsx";
import {IsoErrorBoundary, DefaultErrorFallback} from "./IsoErrorBoundary.jsx";
import {errorCreateStackFrames} from "../utils/error-util.js";
import {TraceMap, originalPositionFor} from '@jridgewell/trace-mapping';

export class IsoState {
	constructor({refs, props, url, localFetch, sourceRoot, sourcemap, fs, request}={}) {
		//console.log("iso state constructor, sourcemap="+sourcemap);

		this.isoRefState=new IsoRefState({initialRefValues: refs});
		this.routerState=new RouterState({url});
		this.url=url;
		this.props=props;
		this.headChildren=[];
		this.localFetch=localFetch;
		this.errorFallback=DefaultErrorFallback;
		this.sourceRoot=sourceRoot;
		this.sourcemap=sourcemap;
		this.fs=fs;
		this.request=request;
	}

	isSsr() {
		//console.log("is ssr called");

		return !globalThis.window;
	}

	getData() {
		return ({
			refs: this.isoRefState.getSharedRefValues(),
			props: this.props
		});
	}

	fetch=async (url, options={})=>{
		if (this.isSsr() && url.startsWith("/") && this.localFetch) {
			url=new URL(this.request.url).origin+url;
			let request=new Request(url.toString(),options);

			if (this.request.headers.get("cookie"))
				request.headers.set("cookie",this.request.headers.get("cookie"));

			let localFetchResponse=await this.localFetch(request);
			if (localFetchResponse.status!=200) {
				console.log("****** local fetch failed");
				//console.log("local fetch request: ",req);
				//console.log("local fetch request: ",localFetchResponse);
			}

			return localFetchResponse;
		}

		if (url.startsWith("/"))
			url=new URL(this.url).origin+url;

		return await globalThis.fetch(url,options);
	}

	async processError(error) {
		error.stackFrames=await errorCreateStackFrames({
			stack: error.stack, 
			sourceRoot: this.sourceRoot,
			sourcemap: this.sourcemap,
			fs: this.fs,
		});
	}
}

export function createIsoState({refs, props, url}={}) {
	return new IsoState({refs, props, url});
}

export const IsoContext=createContext();

export function useIsoContext() {
	return useContext(IsoContext);
}

export function IsoContextProvider({isoState, children}) {
	/*return (
		<IsoContext.Provider value={isoState}>
						{children}
		</IsoContext.Provider>
	);*/

	return (
		<IsoContext.Provider value={isoState}>
			<IsoErrorBoundary fallback={DefaultErrorFallback}>
				<IsoRefContext.Provider value={isoState.isoRefState}>
					<Router routerState={isoState.routerState}>
						{children}
					</Router>
				</IsoRefContext.Provider>
			</IsoErrorBoundary>
		</IsoContext.Provider>
	);
}
