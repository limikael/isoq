import Browser from "@browser";
import IsoqClient from "./IsoqClient.js";
import IsoContext from "./IsoContext.js";
import {RouterProvider} from "../components/router.js";

let isoClient=new IsoqClient(window.__isoData,window.__isoDeps,window.__isoRefs);
let content=(
	<IsoContext.Provider value={isoClient}>
		<RouterProvider>
			<Browser {...window.__isoProps}/>
		</RouterProvider>
	</IsoContext.Provider>
)
hydrate(content,document.getElementById("isoq"));
