import {useState, useRef, useMemo, useCallback, useLayoutEffect} from "react";

export function useAsyncMemo(fn, deps=[]) {
	let [val,setVal]=useState();
	let queueRef=useRef();
	let runningRef=useRef();

	//console.log("use async, deps="+deps);

	useMemo(async ()=>{
		if (runningRef.current) {
			if (JSON.stringify(deps)!=runningDeps.current.deps) {
				queueRef.current={
					deps: JSON.stringify(deps),
					fn: fn
				}
			}

			return;
		}

		queueRef.current={
			deps: JSON.stringify(deps),
			fn: fn
		};

		while (queueRef.current) {
			runningRef.current=queueRef.current;
			queueRef.current=null;

			try {
				setVal(undefined);
				//console.log("running async memo, deps=",deps);
				let res=await runningRef.current.fn();
				if (!queueRef.current)
					setVal(res);
			}

			catch (e) {
				console.error(e);
				if (!queueRef.current)
					setVal(e);
			}

			runningRef.current=null;
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
