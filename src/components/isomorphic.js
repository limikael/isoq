import {useId} from "preact/compat";

export class IsoContext {
	constructor() {
		this.promises={};
		this.data={};
	}

	with(fn) {
		global.__isoContext=this;
		let res=fn();
		global.__isoContext=undefined;

		return res;
	}

	async wait() {
		for (let id in this.promises)
			this.data[id]=await this.promises[id];
	}

	hasPromises() {
		return (Object.keys(this.promises).length>0);
	}
}

export function useIso(fn) {
	let id=useId();

	// Server
	if (typeof window==="undefined") {
		let context=global.__isoContext;

		if (!context.promises[id])
			context.promises[id]=fn();

		return context.data[id];
	}

	// Client
	else {
		return window.__isoData[id];
	}
}