import {useIsoMemo} from "isoq";
import {useState} from "react";

export default function Main() {
	let [value,setValue]=useState(1);
	let doubleValue=useIsoMemo(async()=>{
		console.log("the value is: "+value);
		return value*2;
	},[value]);

	return (<>
		<h1>Hello World</h1>
		<p>This is the website...</p>
		<p>Double value is: {doubleValue}</p>
		<button onclick={()=>setValue(value+1)}>inc</button>
	</>);
}