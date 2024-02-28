import {createContext, useRef, useContext, useLayoutEffect, useCallback, useState, createElement} from "react";
import {useEventUpdate} from "../utils/react-util.js";
import {useIsoContext} from "../isoq/IsoContext.js";

export let IsoSuspenseContext=createContext();

class IsoSuspenseState extends EventTarget {
	constructor(onComplete) {
		super();
		this.barrierCount=0;
		this.complete=false;
		this.onComplete=onComplete;
	}

	isLoading() {
		return (this.barrierCount>0);
	}

	isComplete() {
		return this.complete;
	}

	updateCount(v) {
		let loading=this.isLoading();
		this.barrierCount+=v;
		if (this.isLoading()!=loading)
			this.dispatchEvent(new Event("loadingStateChange"));
	}

	createBarrier() {
		let resolved=false;
		this.updateCount(1);

		return (()=>{
			if (resolved)
				return;

			resolved=true;
			this.updateCount(-1);
		});
	}

	checkComplete() {
		if (!this.effectRun || this.complete)
			return;

		if (!this.isLoading()) {
			this.complete=true;
			if (this.onComplete)
				this.onComplete();
		}
	}
}

export function IsoSuspense({children, fallback, onComplete, suspend}) {
	let iso=useIsoContext();
	if (suspend===undefined)
		suspend=true;

	let [_,setDummyState]=useState();
	let forceUpdate=useCallback(()=>setDummyState({}));
	let ref=useRef();
	if (!ref.current)
		ref.current=new IsoSuspenseState(onComplete);

	let isoSuspenseState=ref.current;
	useLayoutEffect(()=>{
		isoSuspenseState.effectRun=true;
		isoSuspenseState.checkComplete();
		if (isoSuspenseState.complete)
			forceUpdate();
	},[]);

	useEventUpdate(isoSuspenseState,"loadingStateChange");
	isoSuspenseState.checkComplete();

	let doSuspend=(
		!iso.isSsr() &&
		!isoSuspenseState.isComplete() && 
		suspend
	);

	//console.log("do suspend: "+doSuspend);

	let style={};
	if (doSuspend)
		style={display: "none"};

	return (
		createElement(IsoSuspenseContext.Provider,{value: isoSuspenseState},
			createElement("div",{style: style},
				children
			)
		)
	);
}
