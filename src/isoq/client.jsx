import Browser from "@browser";
import IsoqClient from "./IsoqClient.js";
import IsoContext from "./IsoContext.js";
import {RouterProvider} from "../components/router.js";
import {IsoIdNamespace, useIsoId} from "../components/useIsoId.js";

let isoClient=new IsoqClient(window.__isoRefs);
let content=(
	<IsoContext.Provider value={isoClient}>
		<IsoIdNamespace name="root">
			<RouterProvider>
				<Browser {...window.__isoProps}/>
			</RouterProvider>
		</IsoIdNamespace>
	</IsoContext.Provider>
)
hydrate(content,document.getElementById("isoq"));
if (Object.keys(isoClient.refs).length)
	console.log(
		"Warning, unused refs after hydration: ",
		Object.keys(isoClient.refs)
	);
