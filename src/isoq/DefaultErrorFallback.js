import {createElement} from "react";

export default function DefaultErrorFallback({error}) {
	let style={
		position: "fixed",
		left: "0",
		top: "0",
		width: "100%",
		height: "100%",
		zOrder: "100",
		backgroundColor: "#000000",
		color: "#ff0000",
		fontSize: "16px",
		fontFamily: "monospace",
		borderStyle: "solid",
		borderWidth: "0.5em",
		borderColor: "#ff0000",
		padding: "0.5em",
		boxSizing: "border-box",
		whiteSpace: "pre"
	}

	//console.error(error);

	let message=error.toString();
	if (error.stack)
		message=error.stack;

	return createElement("div",{style: style},message);
}
