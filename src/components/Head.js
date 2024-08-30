import {useIsoContext} from "../isoq/IsoContext.js";
import {createElement, Fragment} from "react";

export function Head({children}) {
	let isoContext=useIsoContext();

	if (isoContext.isSsr())
		isoContext.headChildren.push(children);

	return createElement(Fragment);
}

export default Head;