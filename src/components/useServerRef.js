import {useId, useRef} from "react";
import {useIsoContext} from "../isoq/IsoContext.js";

export function useServerRef(initial) {
	let id=useId();
	let iso=useIsoContext();
	let normalRef=useRef(initial);

	if (iso.isSsr())
		return iso.getServerRef(id,initial);

	return normalRef;
}