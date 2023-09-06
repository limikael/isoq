import Browser from "@browser";

if (typeof window!=="undefined") {
	hydrate(<Browser/>,document.getElementById("isoq"));
}
