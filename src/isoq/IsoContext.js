import {createContext, useContext} from "preact/compat";

const IsoContext=createContext();

export function useIsoContext() {
	return useContext(IsoContext);
}

export default IsoContext;