import Browser from "@browser";
import {IsoqClient, IsoContext, IsoErrorBoundary, DefaultErrorFallback} from "isoq/client-internals";

/*import IsoqClient from "./IsoqClient.js";
import IsoContext from "./IsoContext.js";
import {IsoErrorBoundary} from "../components/IsoErrorBoundary.js";
import DefaultErrorFallback from "./DefaultErrorFallback.js";*/

if (!window.__isoError && window.__iso) {
	let isoClient=new IsoqClient(window.__iso);
	let content=(
		<IsoContext.Provider value={isoClient}>
			<IsoErrorBoundary fallback={DefaultErrorFallback}>
				<Browser {...isoClient.props}/>
			</IsoErrorBoundary>
		</IsoContext.Provider>
	)
	isoClient.hydration=true;
	hydrate(content,document.getElementById("isoq"));
	isoClient.hydration=false;
	if (isoClient.undefRefs.length) {
		console.log(
			"** Warning, undefined refs:",
			isoClient.undefRefs
		);
	}
	if (Object.keys(isoClient.refs).length) {
		console.log(
			"** Warning, unused refs: ",
			Object.keys(isoClient.refs)
		);
	}
}
