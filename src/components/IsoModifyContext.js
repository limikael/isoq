import IsoContext, {useIsoContext} from "../isoq/IsoContext.js";
import {createElement,useRef} from "react";

class ModifiedContext {
	constructor(iso, init={}) {
		this.iso=iso;
		Object.assign(this,init);
	}
}

export function IsoModifyContext({children, ...props}) {
	let iso=useIsoContext();
	let ref=useRef();
	if (!ref.current)
		ref.current=new ModifiedContext(iso, props);

	return createElement(IsoContext.Provider,{value: ref.current},children);
}