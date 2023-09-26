import {useIsoContext} from "../isoq/IsoContext.js";
import {useIsoId} from "./useIsoId.js";

export function useIsoBarrier() {
	let iso=useIsoContext();
	let id=useIsoId();
	return iso.getBarrier(id);
}
