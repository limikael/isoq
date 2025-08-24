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

/**
 * `useIsSsr` tells you whether the current render is happening on the server.
 *
 * This is useful if you need to branch logic between server-side rendering (SSR)
 * and client-side rendering. For example, you might want to avoid using
 * browser-only APIs during SSR.
 *
 * @returns {boolean} `true` if rendering on the server, otherwise `false`.
 *
 * @example
 * function PlatformInfo() {
 *   const isSsr = useIsSsr();
 *   return <div>{isSsr ? "Server render" : "Client render"}</div>;
 * }
 */
export function useIsSsr() {
	let iso=useIsoContext();
	return iso.isSsr();
}

/**
 * `useIsoFetch` returns a function that behaves like the standard
 * `fetch`, but with special handling for server-side environments.
 *
 * On the client, it is simply an alias for the global `fetch`.
 *
 * On the server:
 * - For **same-origin requests**, it will directly call into the
 *   current server’s request handler instead of sending an HTTP request.
 *   This avoids issues in environments like Cloudflare Workers,
 *   where a worker cannot make a network request to itself.
 * - For **cross-origin requests**, it falls back to the normal `fetch`.
 *
 * Unlike the built-in `fetch`, this function also supports using
 * **origin-relative URLs** such as `/api/users/123`. These will resolve
 * correctly against the application’s origin in both server and client
 * environments.
 *
 * From the programmer’s perspective, you can use it just like `fetch`,
 * without needing to worry about whether the code runs on the client,
 * the server, or under special hosting restrictions.
 *
 * @returns {(input: RequestInfo, init?: RequestInit) => Promise<Response>}
 *   A fetch-compatible function.
 *
 * @example
 * function UserProfile({ id }) {
 *   const isoFetch = useIsoFetch();
 *
 *   async function load() {
 *     const res = await isoFetch(`/api/users/${id}`);
 *     const user = await res.json();
 *     console.log(user.name);
 *   }
 *
 *   useEffect(() => { load(); }, []);
 *
 *   return <div>Loading user...</div>;
 * }
 */
export function useIsoFetch() {
	let iso=useIsoContext();
	return iso.isSsr();
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
