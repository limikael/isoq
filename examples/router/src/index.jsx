import {Link, Route, useLoaderData, useIsoContext, useIsLoading, useIsoRef} from "isoq";
import {useEffect, lazy, Suspense, useMemo} from "react";

function Home() {
	return (
		<p>This is the home page</p>
	);
}

function SomePage() {
	let loaderData=useLoaderData();

	console.log("render some page");

	return (
		<p>This is another page, loaderData={loaderData}</p>
	);
}

SomePage.loader=async()=>{
	console.log("Loading some data for some page...");

	await new Promise(r=>setTimeout(r,1000));

	//throw new Error("Loader fail");

	return "123";
}

export default function Main() {
	let loading=useIsLoading();
	let bg=loading?"#0000ff":"#ffffff";

	return (<>
		<div style={`width: 100%; height: 3px; background-color: ${bg}`}/>
		<div>
			<Link href="/">Home</Link>
			|
			<Link href="/somepage">Some Page</Link>
			|
			<Link href="/lazypage">Lazy Page</Link>
		</div>

		<Route path="/">
			<Home/>
		</Route>

		<Route path="/somepage" loader={SomePage.loader}>
			<SomePage/>
		</Route>

		<Route path="/lazypage" lazy={()=>import("./LazyPage.jsx")}/>
	</>);
}