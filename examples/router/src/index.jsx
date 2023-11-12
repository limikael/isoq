import {Link, Route, useLoaderData, useIsoContext, IsoErrorBoundary, useIsoErrorBoundary} from "isoq";
import {useEffect} from "react";

function Home() {
	let iso=useIsoContext();
	let throwError=useIsoErrorBoundary();

	if (!iso.isSsr()) {
		//console.log("client side...");
		//throw new Error("Throwing an error, just because...");

		useEffect(()=>{
			setTimeout(()=>{
				try {
					throw new Error("This is an error...");
				}

				catch (e) {
					throwError(e);
				}

			},1000);
		},[]);
	}

	return (
		<p>This is the home page</p>
	);
}

function SomePage() {
	let loaderData=useLoaderData();

	return (
		<p>This is another page, loaderData={loaderData}</p>
	);
}

SomePage.loader=async()=>{
	console.log("Loading some data for some page...");

	await new Promise(r=>setTimeout(r,1000));

	throw new Error("Loader fail");

	return "123";
}

export default function Main() {
	return (<>
		<div>
			<Link href="/">Home</Link>
			|
			<Link href="/somepage">Some Page</Link>
		</div>

		<Route path="/">
			<Home/>
		</Route>

		<Route path="/somepage" loader={SomePage.loader}>
			<SomePage/>
		</Route>
	</>);
}