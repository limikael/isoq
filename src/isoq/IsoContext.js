import {createContext, useContext, useId} from "preact/compat";

const IsoContext=createContext();

export function useIsoContext() {
	return useContext(IsoContext);
}

export function useIsoUrl() {
	let iso=useIsoContext();
	return iso.getUrl();
}

export function useIsoBarrier() {
	let iso=useIsoContext();
	let id=useId();
	return iso.getCompleteNotifier(id);
}

export default IsoContext;