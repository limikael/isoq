import Browser from "@browser";
import IsoqClient from "./IsoqClient.js";
import IsoContext from "./IsoContext.js";
import {RouterProvider} from "../components/router.js";
import {IsoIdNamespace, useIsoId, IsoIdRoot} from "../components/useIsoId.js";
import {IsoErrorBoundary} from "../components/IsoErrorBoundary.js";
import DefaultErrorFallback from "./DefaultErrorFallback.js";

if (!window.__isoError) {
	let isoClient=new IsoqClient(window.__isoRefs);
	let content=(
		<IsoContext.Provider value={isoClient}>
			<IsoErrorBoundary fallback={DefaultErrorFallback}>
				<IsoIdRoot name="root">
					<RouterProvider>
						<Browser {...window.__isoProps}/>
					</RouterProvider>
				</IsoIdRoot>
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
