import {IsoSuspense, useIsoMemo} from "isoq";
import {useState, useEffect} from "react";

function Suspending() {
	let data=useIsoMemo(async()=>{
		console.log("getting data for 0");
		await new Promise(r=>setTimeout(r,1000));
		return "hello world";
	});

	useEffect(()=>{
		console.log("eff");
	},[]);

	return (<div>data: {data}</div>);
}

function Suspending2() {
	let data=useIsoMemo(async()=>{
		console.log("getting data for 1");
		await new Promise(r=>setTimeout(r,1000));
		return "hello world 2";
	});

	return (<div>data in 2: {data}</div>);
}

export default function() {
	let [page,setPage]=useState(0);

	return (<>
		<h1>test</h1>
		<p>testing this suspense...</p>
		<div>
			<button onclick={()=>setPage(0)}>page 0</button>
			<button onclick={()=>setPage(1)}>page 1</button>
		</div>

		{page==0 &&
			<IsoSuspense>
				<Suspending/>
			</IsoSuspense>
		}
		{page==1 &&
			<IsoSuspense>
				<Suspending2/>
			</IsoSuspense>
		}
	</>);
}
