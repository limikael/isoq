import {createContext, useContext} from "react";
import {useEventUpdate} from "../utils/react-util.js";
import {useIsoContext} from "./IsoContext.jsx";

class LoadingState extends EventTarget {
	constructor() {
		super();
		this.loaderCount=0;
	}

	isLoading() {
		return (this.loaderCount>0);
	}

	updateCount(v) {
		let loading=this.isLoading();
		this.loaderCount+=v;
		if (this.isLoading()!=loading)
			this.dispatchEvent(new Event("loadingStateChange"));
	}

	createLoader() {
		let resolved=false;
		this.updateCount(1);

		return (()=>{
			if (resolved)
				return;

			resolved=true;
			this.updateCount(-1);
		});
	}
}

export function useLoadingState() {
	let iso=useIsoContext();
	if (!iso.loadingState)
		iso.loadingState=new LoadingState();

	return iso.loadingState;
}

//export let LoadingContext=createContext(new LoadingState());

/**
 * `useIsoLoading` is a hook that tells you whether there are any
 * asynchronous operations currently pending during isomorphic rendering.
 *
 * It returns `true` if the app is waiting on a Suspense boundary or
 * an async computation from `useIsoMemo`. Otherwise, it returns `false`.
 *
 * This can be useful for rendering global indicators (like a loading bar
 * or spinner) while parts of the UI are still resolving data.
 *
 * @returns {boolean} Whether there are active loading operations.
 *
 * @example
 * function LoadingIndicator() {
 *   const isLoading = useIsoLoading();
 *
 *   return isLoading ? <div className="spinner" /> : null;
 * }
 */
export function useIsLoading() {
	//console.log("render is loading");

	let loadingState=useLoadingState();
	useEventUpdate(loadingState,"loadingStateChange");

	return loadingState.isLoading();
}