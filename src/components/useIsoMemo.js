import {useId, useContext} from "react";
import {useIsoContext} from "../isoq/IsoContext.js";
import {useAsyncMemo} from "../utils/react-util.js";
import {jsonEq} from "../utils/js-util.js";

export function useIsoMemo(fn, deps=[]) {
	let id=useId();
	let iso=useIsoContext();

	// Server
	if (iso.isSsr()) {
		if (!iso.promises[id]) {
			iso.promises[id]=fn();
			iso.deps[id]=deps;
		}

		return iso.data[id];
	}

	// Client
	else {
		let v=useAsyncMemo(async()=>{
			if (iso.getData(id)!==undefined && jsonEq(deps,iso.getDeps(id)))
				return;

			iso.markIsoDataStale(id);
			return await fn();
		},deps);

		if (v!==undefined)
			return v;

		if (iso.getData(id)!==undefined && jsonEq(deps,iso.getDeps(id)))
			return iso.getData(id);
	}
}

export default useIsoMemo;