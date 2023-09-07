import {useIsoContext} from "../isoq/IsoContext.js";
import {useIsoMemo} from "./useIsoMemo.js";

export function useIsoFetch(url, options={}) {
	if (!options.decode)
		options.decode="json";

	let isoContext=useIsoContext();
	let result=useIsoMemo(async ()=>{
		let response=await isoContext.fetch(url,options);

		switch (options.decode) {
			case "json":
				return await response.json();
				break;

			case "text":
				return await response.text();
				break;

			default:
				throw new Error("Can only decode json or text");
		}
	});

	return result;
}

export default useIsoFetch;
