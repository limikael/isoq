import Browser from "@browser";
import IsoqClient from "./IsoqClient.js";
import IsoContext from "./IsoContext.js";
import {IsoErrorBoundary} from "../components/IsoErrorBoundary.js";
import DefaultErrorFallback from "./DefaultErrorFallback.js";

if (!window.__isoError) {
	let isoClient=new IsoqClient(window.__isoRefs);
	let content=(
		<IsoContext.Provider value={isoClient}>
			<IsoErrorBoundary fallback={DefaultErrorFallback}>
				<Browser {...window.__isoProps}/>
			</IsoErrorBoundary>
		</IsoContext.Provider>
	)
	hydrate(content,document.getElementById("isoq"));
	if (Object.keys(isoClient.refs).length)
		console.log(
			"Warning, unused refs after hydration: ",
			Object.keys(isoClient.refs)
		);
}
