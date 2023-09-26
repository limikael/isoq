import {createContext, useRef, useContext, useState, useCallback, useEffect, useLayoutEffect} from "react";
import {splitPath, jsonEq, urlMatchPath} from "../utils/js-util.js";
import {useEventUpdate} from "../utils/react-util.js";
import {useIsoRef, useIsoEffect, useIsoBarrier, useServerRef, useIsoContext} from "isoq";
import {createElement, Fragment} from "react";

class Router extends EventTarget {
	constructor({iso, url, barrier, loaderDataRef}) {
		super();

		this.iso=iso;
		this.barrier=barrier;
		this.loaderDataRef=loaderDataRef;
		this.loadingState=false;

		if (url) {
			this.url=url;
			this.enqueuedUrl=url;
		}
	}

	isSsr() {
		return !!this.url;
	}

	enqueueUrl(url) {
		this.enqueuedUrl=new URL(url,this.getCurrentUrl()).toString();
		this.dispatchEvent(new Event("change"));
	}

	getCurrentUrl() {
		if (this.isSsr())
			return this.url;

		return window.location;
	}

	getEnqueuedUrl() {
		return this.enqueuedUrl;
	}

	async commitEnqueuedUrl(loader) {
		//console.log("***** commit: "+this.enqueuedUrl);

		this.iso.unresolveBarrier(this.barrier);

		let newUrl=this.enqueuedUrl;
		this.enqueuedUrl=undefined;

		if (loader) {
			this.loadingState=true;
			this.dispatchEvent(new Event("loadingStateChange"));
			this.loaderDataRef.current=await loader(newUrl);
			this.loadingState=false;
			this.dispatchEvent(new Event("loadingStateChange"));
		}

		if (!this.isSsr())
			history.pushState(null,null,newUrl);

		this.dispatchEvent(new Event("change"));
		this.barrier();
	}
}

let RouterContext=createContext();

export function useRouter() {
	return useContext(RouterContext);
}

export function useLoaderData() {
	let router=useRouter();
	return router.loaderDataRef.current;
}

export function useIsLoading() {
	let router=useRouter();
	useEventUpdate(router,"loadingStateChange");
	return router.loadingState;
}

export function RouterProvider({url, children}) {
	let barrier=useIsoBarrier();
	let loaderDataRef=useIsoRef();
	let iso=useIsoContext();
	let ref=useServerRef();
	if (!ref.current) {
		//console.log("*** constructing router for: "+url);
		ref.current=new Router({iso, url, barrier, loaderDataRef});
	}

	let router=ref.current;

	useEventUpdate(router,"change");
	useIsoEffect(()=>{
		if (router.getEnqueuedUrl()) {
			if (iso.isSsr()) {
				router.barrier();
			}

			else {
				router.commitEnqueuedUrl();
			}
		}
	});

	router.dispatchEvent(new Event("childrender"));
	return createElement(
		RouterContext.Provider,
		{value: ref.current},
		children
	);
}

export function Link({children, ...props}) {
	let router=useRouter();

	function onLinkClick(ev) {
		ev.preventDefault();
		router.enqueueUrl(props.href);
	}

	return createElement(
		"a",
		{onclick: onLinkClick, ...props},
		children
	);
}

export function Route({path, loader, children, notFound}) {
	let router=useRouter();
	useEventUpdate(router,"childrender");
	//console.log("render: "+path+", current: "+router.getCurrentUrl()+", queue: "+router.getEnqueuedUrl());

	if (urlMatchPath(router.getEnqueuedUrl(),path)) {
		//console.log("committing: "+path);
		router.commitEnqueuedUrl(loader);
	}

	if (urlMatchPath(router.getCurrentUrl(),path))
		return createElement(Fragment,{},children);
}