import {createContext, useContext} from "react";
import {urlMatchPath} from "../utils/js-util.js";
import {useIsoRef, useIsoContext, useIsoMemo, useIsoBarrier} from "isoq";
import {useEventUpdate} from "../utils/react-util.js";
import {createElement, Fragment} from "react";
import {IsoIdNamespace} from "./useIsoId.js";

class Router extends EventTarget {
	constructor(isoContext, loaderDataRef) {
		super();
		this.initialUrl=isoContext.getUrl();

		if (!isoContext.isSsr())
			this.currentUrl=isoContext.getUrl();

		this.pendingUrl=isoContext.getUrl();
		this.loaderDataRef=loaderDataRef;

		if (!isoContext.isSsr()) {
			window.addEventListener("popstate",(e)=>{
				this.setPendingUrl(window.location);
			});
		}

	}

	getInitialUrl() {
		return this.initialUrl;
	}

	getCurrentUrl() {
		return this.currentUrl;
	}

	getPendingUrl() {
		return this.pendingUrl;
	}

	getLoaderData() {
		return this.loaderDataRef.current;
	}

	setCurrentUrl(url) {
		this.currentUrl=new URL(url,this.initialUrl).toString();
		this.dispatchEvent(new Event("change"));
	}

	setPendingUrl(url) {
		this.pendingUrl=new URL(url,this.initialUrl).toString();
		this.dispatchEvent(new Event("change"));
	}

	setLoaderData(loaderData) {
		//console.log("set loader data: "+loaderData);
		this.loaderDataRef.current=loaderData;
		this.dispatchEvent(new Event("change"));
	}

	resolveUrl(url) {
		return new URL(url,this.initialUrl).toString();
	}
}

let RouterContext=createContext();

export function RouterProvider({url, children}) {
	let iso=useIsoContext();
	let ref=useIsoRef(null,true);
	let loaderDataRef=useIsoRef();
	if (!ref.current)
		ref.current=new Router(iso,loaderDataRef);

	useEventUpdate(ref.current,"change");

	return createElement(
		RouterContext.Provider,
		{value: ref.current},
		children
	);
}

export function useRouter() {
	return useContext(RouterContext);
}

export function useIsLoading() {
	let router=useRouter();
	useEventUpdate(router,"change");
	return (router.getCurrentUrl()!=router.getPendingUrl());
}

export function Link({children, ...props}) {
	let router=useRouter();

	function onLinkClick(ev) {
		if (props.onclick)
			props.onclick(ev);

		ev.preventDefault();

		if (props.href) {
			if (router.resolveUrl(props.href)==router.getCurrentUrl() &&
					router.resolveUrl(props.href)==router.getPendingUrl()) {
				window.scrollTo(0,0);
			}

			else
				router.setPendingUrl(props.href);
		}
	}

	return createElement(
		"a",
		{...props, onclick: onLinkClick},
		children
	);
}

export function useRouterUrl() {
	let router=useRouter();
	useEventUpdate(router,"change");

	if (router.getCurrentUrl())
		return router.getCurrentUrl();

	return router.getInitialUrl();
}

export function useLoaderData() {
	let router=useRouter();
	useEventUpdate(router,"change");

	return router.getLoaderData();
	return null;
}

export function Route({path, loader, children}) {
	let barrier=useIsoBarrier();
	let router=useRouter();
	let iso=useIsoContext();
	useEventUpdate(router,"change");

	useIsoMemo(async()=>{
		if (urlMatchPath(router.getPendingUrl(),path)) {
			let pendingUrl=router.getPendingUrl();
			if (router.getPendingUrl()!=router.getCurrentUrl()) {
				let loaderData;
				if (loader) {
					//await new Promise(r=>setTimeout(r,1000));
					loaderData=await loader(router.getPendingUrl());
				}

				if (router.getPendingUrl()==pendingUrl) {
					router.setLoaderData(loaderData);
					router.setCurrentUrl(router.getPendingUrl());

					if (!iso.isSsr()) {
						if (window.location!=router.getCurrentUrl()) {
							history.scrollRestoration="manual";
							history.pushState(null,null,router.getCurrentUrl());
						}

						setTimeout(()=>{
							window.scrollTo(0,0);
						},0);
					}
				}
			}
			barrier();
		}

		else {
			barrier();
		}
	},[router.getPendingUrl()]);

	let theChildren;
	if (urlMatchPath(router.getCurrentUrl(),path))
		theChildren=children;

	return createElement(IsoIdNamespace,{},theChildren);
}