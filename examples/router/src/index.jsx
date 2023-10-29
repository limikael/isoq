import {Link, Route, useLoaderData} from "isoq";

function Home() {
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