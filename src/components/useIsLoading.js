import {createContext, useContext} from "react";
import {useEventUpdate} from "../utils/react-util.js";
import {useIsoContext} from "../isoq/IsoContext.js";

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

export function useIsLoading() {
	//console.log("render is loading");

	let loadingState=useLoadingState();
	useEventUpdate(loadingState,"loadingStateChange");

	return loadingState.isLoading();
}