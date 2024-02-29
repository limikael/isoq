import {useIsoContext, useIsoCookie} from "isoq";

export default function() {
	let iso=useIsoContext();
	let cookie2=useIsoCookie("cookie2");
	console.log("cookie2: "+cookie2); //iso.getCookie("cookie2"));

	if (iso.isSsr()) {
		iso.setCookie("cookie1","cookie 1 value");
		iso.setCookie("cookie2","cookie 2 value");
	}

	return (<>
		<button onclick={()=>iso.setCookie("cookie2","hello")}>set cookie2</button>
		Cookie1: {iso.getCookie("cookie1")}
	</>);
}