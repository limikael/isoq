import {useIsoMemo, useIsoContext} from "isoq";

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

export default function() {
	return (<>
		<h1>Hello</h1>
		<p>Testing... xyz</p>
	</>);
}
