import {useIsoContext} from "isoq";

export function test() {
	console.log("this is the test..");
}

export default function () {
	let iso=useIsoContext();
	console.log("i'm rendering, ssr="+iso.isSsr());

	return <>
		<h1>Hello</h1>
		<p>Hello World</p>
	</>
}