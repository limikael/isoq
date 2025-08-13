import {createContext} from "preact";
import {createElement, Suspense} from "preact/compat";
import {useContext, useEffect, useLayoutEffect} from "preact/hooks";
import {useRefId} from "../utils/preact-refid.js";
import {arrayRemove} from "../utils/js-util.js";

export const IsoRefContext=createContext();

export class IsoRef {
	constructor(isoRefState, initialValue, options) {
		this.isoRefState=isoRefState;
		this.refCount=0;
		this.current=initialValue;
		this.ids=[];

		this.shared=options.shared;
		if (this.shared===undefined)
			this.shared=true;
	}

	ref(id) {
		//console.log("ref: "+id);
		if (!this.ids.includes(id))
			this.ids.push(id);
	}

	unref(id) {
		arrayRemove(this.ids,id);
		if (!this.ids.length)
			this.isoRefState.scheduleSweep();
	}
}

export class IsoRefState {
	constructor({initialRefValues}={}) {
		this.refs={};
		this.sweepTimeout=null;
		this.sweepBlockIds=[];

		if (initialRefValues) {
			for (let k in initialRefValues)
				this.refs[k]=new IsoRef(this,initialRefValues[k],{shared: true});
		}
	}

	getRef(id, initialValue, options) {
		if (!this.refs[id]) {
			this.refs[id]=new IsoRef(this,initialValue,options);
			this.scheduleSweep();
		}

		return this.refs[id];
	}

	scheduleSweep() {
		if (!globalThis.window ||
				this.sweepTimeout ||
				this.sweepBlockIds.length)
			return;

		//this.sweepTimeout=setTimeout(this.handleSweep,0);
		this.sweepTimeout=requestAnimationFrame(this.handleSweep);
	}

	handleSweep=()=>{
		this.sweepTimeout=null;

		if (this.sweepBlockIds.length)
			return;

		//console.log("sweeping");
		for (let id in this.refs) {
			let ref=this.refs[id];
			//console.log("ref "+id+": "+ref.ids.join(","));

			if (!ref.ids.length) {
				//console.log("evc: "+id);
				delete this.refs[id];
			}
		}
	}

	refSweepBlock(id) {
		if (!this.sweepBlockIds.includes(id))
			this.sweepBlockIds.push(id);
	}

	unrefSweepBlock(id) {
		arrayRemove(this.sweepBlockIds,id);
		if (!this.sweepBlockIds.length)
			this.scheduleSweep();
	}

	getSharedRefValues() {
		let refValues={};
		for (let k in this.refs)
			if (this.refs[k].shared)
				refValues[k]=this.refs[k].current;

		return refValues;
	}
}

export function IsoSuspense({children, fallback}) {
	let isoRefState=useContext(IsoRefContext);
	let refId=useRefId();

	function FallbackWrapper() {
		useLayoutEffect(()=>{
			//console.log("mount fallback");
			isoRefState.refSweepBlock(refId);
			return ()=>{
				//console.log("unmount fallback");
				isoRefState.unrefSweepBlock(refId);
			}
		},[]);

		return fallback;
	}

	return createElement(Suspense,{fallback: createElement(FallbackWrapper)},children);
}

export function useIsoRef(initialValue, options={}) {
	if (typeof options=="boolean")
		options={shared: options};

	let refId=useRefId();
	//console.log("use ref id="+refId);
	let isoRefState=useContext(IsoRefContext);
	let ref=isoRefState.getRef(refId,initialValue,options);
	useLayoutEffect(()=>{
		//console.log("ref effect, id="+refId);
		ref.ref(refId);
		return ()=>{
			//console.log("unmount ref, id="+refId);
			ref.unref(refId);
		}
	},[]);

	return ref;
}