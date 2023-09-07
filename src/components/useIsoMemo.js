import {useId, useContext} from "react";
import {useIsoContext} from "../isoq/IsoContext.js";

export function useIsoMemo(fn) {
	let id=useId();
	let iso=useIsoContext();

	// Server
	if (iso.isSsr()) {
		if (!iso.promises[id])
			iso.promises[id]=fn();

		return iso.data[id];
	}

	// Client
	else {
		return iso.getData(id);
	}
}

export default useIsoMemo;