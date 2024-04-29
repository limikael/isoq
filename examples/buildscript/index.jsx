import {useIsoMemo, useIsoContext} from "isoq";
import {bla} from "fs";

/*export default function() {
	let iso=useIsoContext();
	let x=useIsoMemo(()=>{
		//throw new Error("server error");
	});

	if (!iso.isSsr())
		throw new Error("client error");

	return (<>
		<h1>hello</h1>
	</>);
}*/

export default function({test}) {
	let iso=useIsoContext();

	console.log("url: "+iso.getAppUrl("/hello"));

	return (<>
		<h1>Hello</h1>
		<p>Testing... xyz {test}</p>
		<a href={iso.getAppUrl("/hello")}>test</a>
	</>);
}
