import {IsoRefContext, IsoRefState, useIsoRef, IsoSuspense} from "isoq/iso-ref";
import {useRef, useState, Suspense} from "react";
import {Head, useIsoContext, useIsoMemo} from "isoq";

function Page1() {
	return (
		<div>this is page 1</div>
	);
}

function Page2({count}) {
	let val=useIsoMemo(async()=>{
		console.log("computing for: "+count);
		await new Promise(r=>setTimeout(r,1000));
		return "compute for: "+count;
	},[count],{server: false});

    let ref=useIsoRef(1);

	return (<>
		<div>this is page 2, refval={ref.current}, computeval={val}</div>
	</>);
}

function SuspendedPage2({count}) {
	return (
		<IsoSuspense fallback={<div>Loading...</div>}>
			<Page2 count={count}/>
		</IsoSuspense>  
	);
}

function Page3() {
    let ref=useIsoRef(0);
    let [count,setCount]=useState(1);

    if (!ref.current) {
    	console.log("setting current");
    	ref.current=123;
    }

	return (<>
		<div>this is page 3, val={ref.current}</div>
		<div>count: {count} <button onClick={()=>{ref.current++; setCount(count+1)}}>+</button></div>
	</>);
}

export default function() {
	let [currentPage, setCurrentPage]=useState("page2");
    let [count,setCount]=useState(1);

	return (<>
		<Head>
			<meta name="description" content="this is a page"/>
			<meta name="number" content="123"/>
		</Head>

		<div>count: {count} <button onClick={()=>{setCount(count+1)}}>+</button></div>
		<button onClick={()=>setCurrentPage("page1")}>page 1</button>
		<button onClick={()=>setCurrentPage("page2")}>page 2</button>
		<button onClick={()=>setCurrentPage("page3")}>page 3</button>

		<div>
			{currentPage=="page1" && <Page1/>}
			{currentPage=="page2" && <SuspendedPage2 count={count}/>}
			{currentPage=="page3" && <Page3/>}
		</div>
	</>);
}
