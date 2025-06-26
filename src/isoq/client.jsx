import wrappers from "@wrappers";
import Browser from "@browser";
import {IsoqClient, IsoContext, IsoErrorBoundary, DefaultErrorFallback} from "isoq/client-internals";
import {hydrate} from "preact";

if (!window.__isoError && window.__iso) {
	let isoClient=new IsoqClient({...window.__iso, window: window});

	let content=<Browser {...isoClient.props}/>;

	for (let W of [...wrappers].reverse())
		content=<W {...isoClient.props}>{content}</W>

	content=(
		<IsoContext.Provider value={isoClient}>
			<IsoErrorBoundary fallback={DefaultErrorFallback}>
				{content}
			</IsoErrorBoundary>
		</IsoContext.Provider>
	)
	isoClient.hydration=true;

	hydrate(content,window.document.getElementById("isoq"));

	isoClient.hydration=false;
	if (Object.keys(isoClient.refs).length) {
		console.log(
			"** Warning, unused refs: ",
			Object.keys(isoClient.refs)
		);
	}
}
