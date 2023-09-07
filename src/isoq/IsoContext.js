import {createContext, useContext} from "react";

const IsoContext=createContext();

export function useIsoContext() {
	return useContext(IsoContext);
}

export default IsoContext;