import {useRef} from "react";
import {useIsoContext} from "../isoq/IsoContext.js";
import {useIsoId} from "./useIsoId.js";

export function useIsoRef(initial) {
	let id=useIsoId();
	let iso=useIsoContext();
	let spare=useRef(initial);

	if (iso.isSsr()) {
		return iso.getIsoRef(id,initial);
	}

	else {
		let cand=iso.getIsoRef(id);
		if (cand)
			return cand;

		return spare;
	}
}