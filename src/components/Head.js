import {useIsoContext} from "../isoq/IsoContext.js";

export function Head({children}) {
	let isoContext=useIsoContext();

	if (isoContext.isSsr())
		isoContext.headChildren=children;

	return "";
}

export default Head;