import {createContext} from "preact";
import {useContext, useLayoutEffect, useEffect, useRef} from "preact/hooks";
import {useEventUpdate} from "../utils/react-util.js";
import {urlMatchPath, urlGetArgs} from "../utils/js-util.js";
import {IsoSuspense} from "./iso-ref.js";

const RouterContext=createContext();
const RouteContext=createContext();
const RouteMatchContext=createContext();

/**
 * `useRedirect` provides a function for programmatic navigation.
 *
 * It works like using a {@link Link}, but instead of rendering a link,
 * you call the returned function directly to change the URL.
 *
 * This is useful for cases where navigation should happen in response
 * to an event (such as after form submission or button click) rather
 * than through a visible link.
 *
 * When called, the function will update the current URL and trigger
 * route matching. If the target route suspends, the current page will
 * remain visible until the new one is ready (the same behavior as with `Link`).
 *
 * @returns {(url: string) => void} A function to navigate to the given URL.
 *
 * @example
 * function LoginForm() {
 *   const redirect = useRedirect();
 *
 *   async function handleLogin() {
 *     await loginUser();
 *     redirect("/dashboard");
 *   }
 *
 *   return <button onClick={handleLogin}>Login</button>;
 * }
 */
export function useRedirect() {
	let redirectedRef=useRef();
	let routerState=useContext(RouterContext);
	return (url=>{
		if (redirectedRef.current==url)
			return;

		redirectedRef.current=url;
		routerState.setUrl(url);
	});
}

/**
 * `useRouteLocation` is a hook that provides the current location,
 * similar to `window.location`, but adapted for isomorphic navigation.
 *
 * During a navigation triggered by {@link Link}, React may keep rendering
 * the previous page while the new page is still loading (for example,
 * if the new route suspends). In this case:
 *
 * - Components from the **old route** will continue to receive the
 *   **previous location** value, so they remain consistent while still visible.
 * - Components in the **new route** will see the **new target location**
 *   immediately, even if they are not yet fully rendered.
 *
 * This ensures that both the outgoing and incoming routes see a
 * "sensible" location value, avoiding inconsistencies during
 * transitions and loading states.
 *
 * @returns {string} The currently rendered url.
 *
 * @example
 * function ShowPath() {
 *   const location = useRouteLocation();
 *   return <div>Current path: {location}</div>;
 * }
 */
export function useRouteLocation() {
	let routeValue=useContext(RouteContext);
	return routeValue.url;
}

export function useLocation() {
	return useRouteLocation();
}

/**
 * `useRouteArgs` returns the dynamic arguments captured by wildcards
 * in the current route’s `path`.
 *
 * For example, with a route path of `/blog/*` and a URL of `/blog/hello`,
 * `useRouteArgs()` will return `["hello"]`.
 *
 * With `/docs/**` and `/docs/guides/setup/install`, it will return
 * `["guides", "setup", "install"]`.
 *
 * This is useful for building dynamic pages without needing a full
 * parameterized router.
 *
 * @returns {string[]} An array of matched wildcard segments.
 *
 * @example
 * <Route path="/blog/*">
 *   <BlogPost />
 * </Route>
 *
 * function BlogPost() {
 *   const [slug] = useRouteArgs();
 *   return <div>Post slug: {slug}</div>;
 * }
 */
export function useRouteArgs() {
	let routeValue=useContext(RouteContext);
	let routeMatchValue=useContext(RouteMatchContext);
	if (!routeMatchValue)
		return urlGetArgs(routeValue.url);

	return urlMatchPath(routeValue.url,routeMatchValue.path);
}

/**
 * `useRouteParams` is a convenience hook for accessing query parameters
 * from the current URL.
 *
 * Internally it calls {@link useRouteLocation}, then parses the
 * query string and returns all parameters as an object.
 *
 * @returns {Object.<string, string>} An object mapping query parameter
 *   names to values. If a parameter appears multiple times, only the
 *   last value is returned.
 *
 * @example
 * // For /search?q=react&page=2
 * function SearchPage() {
 *   const params = useRouteParams();
 *   return (
 *     <div>
 *       Searching for: {params.q}, page {params.page}
 *     </div>
 *   );
 * }
 */
export function useRouteParams() {
	let url=new URL(useRouteLocation());
	return Object.fromEntries(url.searchParams);
}

/**
 * `Route` conditionally renders its children based on the current URL path.
 *
 * The `path` prop can include wildcards:
 * - `*` matches a single path segment.
 * - `**` matches any number of trailing segments.
 *
 * When navigation happens via {@link Link}, if the target route suspends,
 * the current `Route` will remain visible until the new route is ready.
 * This avoids showing a blank screen during page transitions.
 *
 * @param {object} props
 * @param {string} props.path - The path pattern to match (supports `*` and `**`).
 * @param {React.ReactNode} props.children - The UI to render when the path matches.
 *
 * @example
 * <Route path="/about">
 *   <AboutPage />
 * </Route>
 *
 * <Route path="/blog/*">
 *   <BlogPost />
 * </Route>
 *
 * <Route path="/docs/**">
 *   <Docs />
 * </Route>
 */
export function Route({path, children}) {
	//return children;

	let routeValue=useContext(RouteContext);
	let match=urlMatchPath(routeValue.url,path);
	if (!match)
		return (<RouteMatchContext.Provider></RouteMatchContext.Provider>);

	return (<RouteMatchContext.Provider value={{path}}>{children}</RouteMatchContext.Provider>);
}

export class RouterState extends EventTarget {
	constructor({url}) {
		super();

		this.baseUrl=new URL(url).origin;
		this.committedUrl=new URL(url).toString();
		this.committedVersion=1;
		this.nextVersion=0;
		this.nextUrl="";
		this.isSsr=!globalThis.window;

		if (!this.isSsr) {
			globalThis.window.addEventListener("popstate",(e)=>{
				this.setUrl(String(globalThis.window.location));
			});
		}
	}

	setUrl(url) {
		if (this.isSsr) {
			this.redirectUrl=url;
			return;
		}

		this.nextUrl=new URL(url,this.baseUrl).toString();

		if (this.nextVersion)
			this.nextVersion++;

		else
			this.nextVersion=this.committedVersion+1;

		this.dispatchEvent(new Event("change"));
	}

	postNavScroll() {
		console.log("post nav scroll...");

		let win=globalThis.window;
		let u=new URL(this.committedUrl);
		let el;

		if (u.hash) {
			let hash=u.hash.replace("#","");
			el=win.document.getElementById(hash);

			let els=win.document.getElementsByName(hash);
			if (els.length)
				el=els[0];
		}

		if (el)
			el.scrollIntoView({
				behavior: 'smooth'
			});

		else
			win.scrollTo(0,0);
	}

	commit() {
		this.committedUrl=this.nextUrl;
		this.committedVersion=this.nextVersion;
		this.nextVersion=null;
		this.nextUrl=null;

		this.dispatchEvent(new Event("change"));
		if (!this.isSsr) {
			let w=globalThis.window;
			if (w.location!=this.committedUrl) {
				w.history.scrollRestoration="manual";
				w.history.pushState(null,null,this.committedUrl);
			}

			setTimeout(()=>this.postNavScroll(),0);
		}
	}
}

function CheckMount({onMount, children}) {
	useEffect(()=>{
		if (onMount)
			onMount()
	});

	return children;
}

export function Router({routerState, children}) {
	useEventUpdate(routerState,"change");

	//console.log(routerState);

	return (
		<RouterContext.Provider value={routerState}>
			<IsoSuspense key={"route-"+routerState.committedVersion}>
				<div style={{display: "contents"}}>
					<CheckMount>
						<RouteContext.Provider value={{url: routerState.committedUrl}}>
							{children}
						</RouteContext.Provider>
					</CheckMount>
				</div>
			</IsoSuspense>
			{!!routerState.nextVersion &&
				<IsoSuspense key={"route-"+routerState.nextVersion}>
					<div style={{display: "none"}}>
						<CheckMount onMount={()=>routerState.commit()}>
							<RouteContext.Provider value={{url: routerState.nextUrl}}>
								{children}
							</RouteContext.Provider>
						</CheckMount>
					</div>
				</IsoSuspense>
			}
		</RouterContext.Provider>
	);
}