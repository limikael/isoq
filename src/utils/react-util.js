import {useState, useRef, useMemo, useCallback, useLayoutEffect} from "react";

export function useAsyncMemo(fn, deps=[]) {
	let [val,setVal]=useState();
	let queueRef=useRef();
	let runningRef=useRef(false);
	let runningDeps=useRef();

	//console.log("use async, deps="+deps);

	useMemo(async ()=>{
		if (runningRef.current) {
			if (JSON.stringify(deps)!=runningDeps.current) {
				//console.log("enqueue, deps=",deps);
				queueRef.current=fn;
			}

			return;
		}

		queueRef.current=fn;
		while (queueRef.current) {
			let f=queueRef.current;
			queueRef.current=null;
			runningRef.current=true;
			runningDeps.current=JSON.stringify(deps);
			try {
				setVal(undefined);
				//console.log("running async memo, deps=",deps);
				let res=await f();
				if (!queueRef.current)
					setVal(res);
			}

			catch (e) {
				console.error(e);
				if (!queueRef.current)
					setVal(e);
			}

			runningRef.current=false;
			runningDeps.current=null;
		}
	},deps);

	return val;
}

export function useEventListener(o, ev, fn) {
	useLayoutEffect(()=>{
		o.addEventListener(ev,fn);
		return ()=>{
			o.removeEventListener(ev,fn);
		}
	},[o,ev,fn]);
}

export function useEventUpdate(o, ev) {
	let [_,setDummyState]=useState();
	let forceUpdate=useCallback(()=>setDummyState({}));
	useEventListener(o,ev,forceUpdate);
}
