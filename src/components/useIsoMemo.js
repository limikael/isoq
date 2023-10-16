import {useContext} from "react";
import {useIsoContext} from "../isoq/IsoContext.js";
import {useAsyncMemo} from "../utils/react-util.js";
import {jsonEq} from "../utils/js-util.js";
import {useIsoRef} from "./useIsoRef.js";
import {useIsoBarrier} from "./useIsoBarrier.js";

export function useIsoMemo(fn, deps=[]) {
	let iso=useIsoContext();
	let ref=useIsoRef();
	let barrier=useIsoBarrier();

	// Server
	if (iso.isSsr()) {
		if (ref.current)
			return ref.current.data;

		(async()=>{
			ref.current={deps: deps};
			ref.current.data=await fn();
			barrier();
		})();
	}

	// Client
	else {
		useAsyncMemo(async()=>{
			if (ref.current && jsonEq(ref.current.deps,deps))
				return;

			ref.current=null;
			let data=await fn();
			ref.current={
				deps: deps,
				data: data
			};

			return {};
		},deps);

		if (ref.current && jsonEq(ref.current.deps,deps))
			return ref.current.data;
	}
}

export default useIsoMemo;