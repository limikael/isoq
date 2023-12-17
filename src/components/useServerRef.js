/*import {useRef} from "react";
import {useIsoContext} from "../isoq/IsoContext.js";
import {useIsoId} from "./useIsoId.js";

export function useServerRef(initial) {
	let id=useIsoId();
	let iso=useIsoContext();
	let normalRef=useRef(initial);

	if (iso.isSsr())
		return iso.getServerRef(id,initial);

	return normalRef;
}*/