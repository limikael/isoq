import {createContext, useRef, useContext, useState, useCallback, useEffect, useLayoutEffect} from "react";
import {splitPath, jsonEq, urlMatchPath} from "../utils/js-util.js";
import {useEventUpdate} from "../utils/react-util.js";
import {useIsoRef, useIsoEffect, useIsoBarrier} from "isoq";
import {createElement, Fragment} from "react";

class Router extends EventTarget {
	constructor({url, onrender, isoRef, loaderDataRef}) {
		super();

		//console.log("constructing router, isoref="+isoRef.current);

		this.onrender=onrender;
		this.isoRef=isoRef;
		this.loaderDataRef=loaderDataRef;
		this.loadingState=false;

		if (url) {
			this.url=url;
			console.log("isoref current: "+this.isoRef.current);

			if (!this.isoRef.current)
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

		this.isoRef.current=true;
		this.dispatchEvent(new Event("change"));

		if (this.onrender)
			this.onrender();
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
	let onrender=useIsoBarrier();
	let isoRef=useIsoRef();
	let loaderDataRef=useIsoRef();
	let ref=useRef();
	if (!ref.current)
		ref.current=new Router({url, onrender, isoRef, loaderDataRef});

	let router=ref.current;

	useEventUpdate(router,"change");
	useIsoEffect(()=>{
		if (router.getEnqueuedUrl())
			router.commitEnqueuedUrl();
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
	console.log("render: "+path+", current: "+router.getCurrentUrl()+", queue: "+router.getEnqueuedUrl());

	if (urlMatchPath(router.getEnqueuedUrl(),path)) {
		console.log("committing: "+path);
		router.commitEnqueuedUrl(loader);
	}

	if (urlMatchPath(router.getCurrentUrl(),path))
		return createElement(Fragment,{},children);
}