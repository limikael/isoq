import {createContext, useContext} from "react";
import {urlMatchPath, waitEvent} from "../utils/js-util.js";
import {useIsoRef, useIsoContext, useIsoMemo, useIsoBarrier} from "isoq";
import {useEventUpdate} from "../utils/react-util.js";
import {createElement, Fragment} from "react";
import {IsoIdNamespace} from "./useIsoId.js";
import {useIsoErrorBoundary} from "./IsoErrorBoundary.js";

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

	markCurrentUrlStale() {
		let u=new URL(this.currentUrl);
		u.searchParams.set("__stale",crypto.randomUUID());
		this.currentUrl=u.toString();
		//console.log("marked stale: "+this.currentUrl);

		this.dispatchEvent(new Event("change"));
	}

	async redirect(url, options={}) {
		if (options.forceReload)
			this.markCurrentUrlStale();

		this.setPendingUrl(url);
		while (this.pendingUrl!=this.currentUrl) {
			//console.log("waiting for change");
			await waitEvent(this,"change");
			//console.log("done waiting, current="+this.currentUrl+" pending: "+this.pendingUrl);
		}
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
	let throwError=useIsoErrorBoundary();
	useEventUpdate(router,"change");

	useIsoMemo(async()=>{
		if (urlMatchPath(router.getPendingUrl(),path)) {
			let pendingUrl=router.getPendingUrl();
			if (router.getPendingUrl()!=router.getCurrentUrl()) {
				let loaderData;
				if (loader) {
					//await new Promise(r=>setTimeout(r,1000));
					try {
						loaderData=await loader(router.getPendingUrl());
					}

					catch (e) {
						throwError(e);
						barrier();
						return;
					}
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
	},[router.getPendingUrl(),router.getCurrentUrl()]);

	let theChildren;
	if (urlMatchPath(router.getCurrentUrl(),path))
		theChildren=children;

	return createElement(IsoIdNamespace,{},theChildren);
}