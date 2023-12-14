import {useIsoContext} from "../isoq/IsoContext.js";
import {useEventUpdate} from "../utils/react-util.js";

export function useIsoCookie(name) {
	let iso=useIsoContext();
	useEventUpdate(iso.cookieDispatcher,name);

	return iso.getCookie(name);
}