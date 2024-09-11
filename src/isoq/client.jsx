import Browser from "@browser";
import {IsoqClient, IsoContext, IsoErrorBoundary, DefaultErrorFallback} from "isoq/client-internals";

/*console.log("****** the client");
console.log(window.__iso);
console.log(window.location);*/

/*(async ()=>{
	let u=new URL(window.__iso.appPathname,window.location);
	let response=await window.fetch(u.toString()+"/bbasfasdf");
	let result=await response.text();
	console.log(result);
})();*/

//window.

if (!window.__isoError && window.__iso) {
	let isoClient=new IsoqClient({...window.__iso, window: window});
	let content=(
		<IsoContext.Provider value={isoClient}>
			<IsoErrorBoundary fallback={DefaultErrorFallback}>
				<Browser {...isoClient.props}/>
			</IsoErrorBoundary>
		</IsoContext.Provider>
	)
	isoClient.hydration=true;

	/*console.log("hydrating...");
	let el=document.getElementById("isoq");
	let el2=document.createElement("div");
	document.body.appendChild(el2);
	render(content,el2);*/

	//render(content,document.getElementById("isoq"));

	hydrate(content,document.getElementById("isoq"));

	isoClient.hydration=false;
	if (isoClient.undefRefs.length) {
		// undefined refs is actually not an error, just the client doing its own thing.
		/*console.log(
			"** Warning, undefined refs:",
			isoClient.undefRefs
		);*/
	}
	if (Object.keys(isoClient.refs).length) {
		console.log(
			"** Warning, unused refs: ",
			Object.keys(isoClient.refs)
		);
	}
}
