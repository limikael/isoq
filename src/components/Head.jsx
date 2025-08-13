import {useIsoContext} from "./IsoContext.jsx";

export function Head({children}) {
	let isoContext=useIsoContext();

	if (isoContext.isSsr())
		isoContext.headChildren.push(children);

	return <></>
}

export default Head;