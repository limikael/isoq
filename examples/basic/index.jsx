import {useIsoRef, Link, Route} from "isoq";

function Pageone() {
	return <div>This is page one</div>;
}

function Pagetwo() {
	return <div>This is page two</div>;
}

export default function({hello}) {
	let ref=useIsoRef();
	if (!ref.current) {
		//console.log("setting ref.current");
		ref.current=123;
	}

	//throw new Error("nope...");

	return (<>
		ref: {ref.current}
		hello: {hello}
		<div>
			<Link href="/pageone">One</Link>
			<Link href="/pagetwo">Two</Link>
		</div>
		<Route path="/pageone"><Pageone/></Route>
		<Route path="/pagetwo"><Pagetwo/></Route>
	</>);
}

