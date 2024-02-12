import {useIsoMemo} from "isoq";

export default function() {
	let x=useIsoMemo(()=>{
		throw new Error("hello");
	});
	return (<>
		<h1>hello</h1>
	</>);
}