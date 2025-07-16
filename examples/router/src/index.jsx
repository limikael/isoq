import {useRef, useState, Suspense} from "react";
import {useIsoMemo, useRouteLocation, Route, useRedirect, useRouteArgs, useRouteParams} from "isoq";

function Page() {
	console.log("render page...");

	let args=useRouteArgs();
	let params=useRouteParams();
	let location=useRouteLocation();
	let val=useIsoMemo(async ()=>{
		console.log("computing...");
		await new Promise(r=>setTimeout(r,1000));
		return location;
	});

	console.log("location: "+location+" val: "+val+" args: "+args.toString());

	return (
		<div>
			location: {location} val: {val} args: {JSON.stringify(args)} params: {JSON.stringify(params)}
		</div>
	);
}

export default function() {
	let redirect=useRedirect();
	let args=useRouteArgs();

	if (args.length==1 && args[0]=="redir") {
		console.log("redirecting...");
		redirect("/hello");
	}

	return (<>
		<button onClick={()=>redirect("")}>/</button>
		<button onClick={()=>redirect("/hello")}>hello</button>
		<button onClick={()=>redirect("/page")}>page</button>
		<button onClick={()=>redirect("/page/1")}>page/1</button>
		<div>
			<Route path="/hello">
				This is the hello page...
			</Route>
			<Route path="/page/**">
				<Page/>
			</Route>
			<Route path="/">
				This is the front page...
			</Route>
		</div>
	</>);
}
