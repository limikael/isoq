import {useIsoContext} from "../isoq/IsoContext.js";
import {useIsoId} from "./useIsoId.js";
import {IsoSuspenseContext} from "./IsoSuspense.js";
import {useContext, useRef, useLayoutEffect} from "react";
import {useLoadingState} from "./useIsLoading.js";

export function useIsoBarrier() {
	let isoSuspenseContext=useContext(IsoSuspenseContext);
	//let loadingContext=useContext(LoadingContext);
	let loadingState=useLoadingState();
	let iso=useIsoContext();
	let id=useIsoId();
	let resolver=useRef();
	let resolved=useRef();

	//console.log("use iso barrier");
	useLayoutEffect(()=>{
		if (!resolved.current) {
			if (!resolver.current) {
				let fns=[loadingState.createLoader()];
				if (isoSuspenseContext)
					fns.push(isoSuspenseContext.createBarrier());

				resolver.current=()=>{
					//console.log("resolving...");
					for (let fn of fns)
						fn();
				}
			}

			return ()=>{
				//console.log("umount");
				if (resolver.current) {
					resolved.current=true;
					resolver.current();
				}
			}
		}
	},[]);

	let barrier=iso.getBarrier(id);

	return ()=>{
		barrier();
		resolved.current=true;
		if (resolver.current)
			resolver.current();
	}
}
