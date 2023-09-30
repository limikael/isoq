import {useContext, createContext, createElement, useId, useRef} from "react";
import {useIsoContext} from "../isoq/IsoContext.js";

let IsoIdNamespaceContext=createContext();

export function IsoIdNamespace({children, name}) {
	if (!name)
		name=useIsoId()+"-";

	let value={
		count: 0,
		name: name
	};

	return createElement(
		IsoIdNamespaceContext.Provider,
		{value},
		children
	);
}

export function useIsoId() {
	let context=useContext(IsoIdNamespaceContext);
	let iso=useIsoContext();

	let val;
	if (!iso.isSsr()) {
		let ref=useRef();
		//console.log(ref);
		if (ref.current===undefined)
			ref.current=context.count++;

		val=ref.current;
	}

	else {
		val=context.count++;
	}

	return context.name+"-"+val;
}