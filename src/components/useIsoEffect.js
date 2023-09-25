import {useEffect,useLayoutEffect} from "react";
import {useIsoContext} from "../isoq/IsoContext.js";

export function useIsoEffect(fn) {
	let iso=useIsoContext();

	if (iso.isSsr()) {
		iso.registerEffect(fn);
	}

	else {
		return useEffect(fn);
	}
}