import Browser from "@browser";
import IsoqClient from "./IsoqClient.js";
import IsoContext from "./IsoContext.js";
import {IsoErrorBoundary} from "../components/IsoErrorBoundary.js";
import DefaultErrorFallback from "./DefaultErrorFallback.js";

if (!window.__isoError && window.__iso) {
	let isoClient=new IsoqClient(window.__iso);
	let content=(
		<IsoContext.Provider value={isoClient}>
			<IsoErrorBoundary fallback={DefaultErrorFallback}>
				<Browser {...isoClient.props}/>
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
