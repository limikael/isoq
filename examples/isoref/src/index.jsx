import {useIsoMemo} from "isoq";

function delay(millis) {
	return new Promise(r=>setTimeout(r,millis));
}

function Test() {
	let value=useIsoMemo(async ()=>{
		console.log("waiting...");
		await delay(1000);
		return 123;
	});

	console.log("render, v="+value);

	return (
		<div>Test: {value}</div>
	)
}

export default function() {
	return <>
		<div>
			<Test/>
		</div>
	</>
}