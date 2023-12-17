import {useContext, createContext, createElement, useId, useRef} from "react";
import {useIsoContext} from "../isoq/IsoContext.js";

let IsoIdNamespaceContext=createContext();

export function IsoIdRoot({children, name}) {
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

export function IsoIdNamespace({children, name}) {
	let id=useIsoId();
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
	let ref=useRef();

	let val;
	if (!iso.isSsr()) {
		//console.log(ref);
		if (ref.current===undefined)
			ref.current=context.count++;

		val=ref.current;
	}

	else {
		val=context.count++;
	}

	/*if (context.name+"-"+val=="root-6") {
		console.log("creating root-6");
		try {
			throw new Error("here");
		}

		catch (e) {
			console.log(e.stack);
		}
	}*/

	return context.name+"-"+val;
}