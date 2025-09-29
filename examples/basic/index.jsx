import {useIsoRef, Link, Route, IsoErrorBoundary, useIsoMemo} from "isoq";
import {useState} from "react";

class Hello {
	constructor({hello}) {
		this.hello=hello+"hydrated";
	}
}

function Pageone() {
	let [val,setVal]=useState();
	return <div>This is page one</div>;
}

function Pagetwo() {
	let val=useIsoMemo(async()=>{
		console.log("running func");
		return {hello: "hello"};
	},[],{
		hydrate: v=>{console.log("running hydrate func"); return new Hello(v)}
	});

	//throw new Error("this is an error...");
	return <div>This is page, val={val.hello}</div>;
}

function ErrorFallback({error}) {
	return <div>There is an error: {error.message}</div>
}

export default function({hello}) {
	let ref=useIsoRef();
	if (!ref.current) {
		//console.log("setting ref.current");
		ref.current=123;
	}

	//throw new Error("nope...");
	/*	<IsoErrorBoundary fallback={ErrorFallback}>
		</IsoErrorBoundary>*/

	return (<>
			some ref: {ref.current}
			hello: {hello}
			<div>
				<Link href="/pageone">One</Link>
				<Link href="/pagetwo">Two</Link>
			</div>
			<Route path="/pageone"><Pageone/></Route>
			<Route path="/pagetwo"><Pagetwo/></Route>
	</>);
}

