import {useContext} from "react";
import {useIsoContext} from "../isoq/IsoContext.js";
import {useAsyncMemo} from "../utils/react-util.js";
import {jsonEq} from "../utils/js-util.js";
import {useIsoRef} from "./useIsoRef.js";
import {useIsoBarrier} from "./useIsoBarrier.js";
import {useIsoErrorBoundary} from "./IsoErrorBoundary.js";

export function useIsoMemo(fn, deps=[]) {
	let iso=useIsoContext();
	let ref=useIsoRef();
	let barrier=useIsoBarrier();
	let throwError=useIsoErrorBoundary();

	// Server
	if (iso.isSsr()) {
		if (ref.current)
			return ref.current.data;

		(async()=>{
			try {
				ref.current={deps: deps};
				ref.current.data=await fn();
			}

			catch (e) {
				console.log("caught error in useIsoMemo");
				throwError(e);
			}

			barrier();
		})();
	}

	// Client
	else {
		let memoRes=useAsyncMemo(async()=>{
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

		if (memoRes instanceof Error) {
			throwError(memoRes);
			return;
		}

		if (ref.current && jsonEq(ref.current.deps,deps))
			return ref.current.data;
	}
}

export default useIsoMemo;