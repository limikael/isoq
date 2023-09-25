import Browser from "@browser";
import IsoqClient from "./IsoqClient.js";
import IsoContext from "./IsoContext.js";

let isoClient=new IsoqClient(window.__isoData,window.__isoDeps,window.__isoRefs);
let content=(
	<IsoContext.Provider value={isoClient}>
		<Browser {...window.__isoProps}/>
	</IsoContext.Provider>
)
hydrate(content,document.getElementById("isoq"));
