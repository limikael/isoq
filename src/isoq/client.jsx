import wrappers from "@wrappers";
import Browser from "@browser";
import {IsoqClient, IsoContext, IsoErrorBoundary, DefaultErrorFallback} from "isoq/client-internals";
import {hydrate} from "preact";
import {IsoRefState, IsoRefContext} from "../utils/iso-ref.js";

if (!window.__isoError && window.__iso) {
	let isoClient=new IsoqClient({...window.__iso, window: window});

	let content=<Browser {...isoClient.props}/>;

	for (let W of [...wrappers].reverse())
		content=<W {...isoClient.props}>{content}</W>

	let isoRefState=new IsoRefState({initialRefValues: window.__iso.refs});

	content=(
		<IsoContext.Provider value={isoClient}>
			<IsoRefContext.Provider value={isoRefState}>
				<IsoErrorBoundary fallback={DefaultErrorFallback}>
					{content}
				</IsoErrorBoundary>
			</IsoRefContext.Provider>
		</IsoContext.Provider>
	)
	isoClient.hydration=true;

	hydrate(content,window.document.getElementById("isoq"));

	isoClient.hydration=false;

	/*isoClient.hydration=false;
	if (Object.keys(isoClient.refs).length) {
		console.log(
			"** Warning, unused refs: ",
			Object.keys(isoClient.refs)
		);
	}*/
}
