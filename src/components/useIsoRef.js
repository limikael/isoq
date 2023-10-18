import {useRef} from "react";
import {useIsoContext} from "../isoq/IsoContext.js";
import {useIsoId} from "./useIsoId.js";

export function useIsoRef(initial, local) {
	let id=useIsoId();
	let iso=useIsoContext();
	let actualRef=useRef(initial);

	if (iso.isSsr()) {
		let ref=iso.getIsoRef(id,initial);
		if (local)
			ref.local=true;

		return ref;
	}

	else {
		let cand=iso.getIsoRef(id);
		if (cand) {
			actualRef.current=cand.current;
			iso.markIsoRefStale(id);
		}

		return actualRef;
	}
}