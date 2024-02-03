import {useRefId} from "../utils/preact-refid.js";

export function IsoIdRoot({children}) {
	return children;
}

export function IsoIdNamespace({children}) {
	return children;
}

export function useIsoId() {
	let refId=useRefId();
	return refId;
}