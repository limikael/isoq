import {createContext, useContext} from "react";

const IsoContext=createContext();

export function useIsoContext() {
	return useContext(IsoContext);
}

export function useIsoUrl() {
	let iso=useIsoContext();
	return iso.getUrl();
}

export default IsoContext;