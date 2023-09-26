import {useRef, useId} from "react";
import {useIsoContext} from "../isoq/IsoContext.js";

export function useIsoRef(initial) {
	let id=useId();
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