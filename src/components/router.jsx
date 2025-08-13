import {createContext} from "preact";
import {useContext, useLayoutEffect, useEffect, useRef} from "preact/hooks";
import {useEventUpdate} from "../utils/react-util.js";
import {urlMatchPath, urlGetArgs} from "../utils/js-util.js";
import {IsoSuspense} from "./iso-ref.js";

const RouterContext=createContext();
const RouteContext=createContext();
const RouteMatchContext=createContext();

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

export function useRouteLocation() {
	let routeValue=useContext(RouteContext);
	return routeValue.url;
}

export function useLocation() {
	return useRouteLocation();
}

export function useRouteArgs() {
	let routeValue=useContext(RouteContext);
	let routeMatchValue=useContext(RouteMatchContext);
	if (!routeMatchValue)
		return urlGetArgs(routeValue.url);

	return urlMatchPath(routeValue.url,routeMatchValue.path);
}

export function useRouteParams() {
	let url=new URL(useRouteLocation());
	return Object.fromEntries(url.searchParams);
}

export function Route({path, children}) {
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
		let win=globalThis.window;
		let u=new URL(this.committedUrl);
		let el;

		if (u.hash) {
			let hash=u.hash.replace("#","");
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