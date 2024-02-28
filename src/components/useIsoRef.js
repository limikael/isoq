import {useRef} from "react";
import {useIsoContext} from "../isoq/IsoContext.js";
import {useIsoId} from "./useIsoId.js";

export function useIsoRef(initial, shared) {
	if (shared===undefined)
		shared=true;

	let id=useIsoId();
	//console.log("useisoid: "+id);
	let iso=useIsoContext();
	let actualRef=useRef(initial);

	if (iso.isSsr()) {
		let ref=iso.getIsoRef(id,initial);
		ref.shared=shared;
		ref.id=id;
		return ref;
	}

	else {
		let cand=iso.getIsoRef(id);
		if (cand) {
			actualRef.current=cand.current;
			iso.markIsoRefStale(id);
		}

		actualRef.id=id;
		return actualRef;
	}
}