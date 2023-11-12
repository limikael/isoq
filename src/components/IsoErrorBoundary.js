import {Component, createContext, useState, createElement, useContext} from "react";
import {useEventUpdate} from "../utils/react-util.js";
import {useIsoContext} from "../isoq/IsoContext.js";

class ErrorBoundaryComponent extends Component {
	componentDidCatch(error, info) {
		//console.log("did catch: ",error);
		//this.props.onerror(error,info);
	}

	static getDerivedStateFromError(error) {
		return { error };
	}

	render() {
		let error;

		if (this.props.error)
			error=this.props.error;

		if (this.state.error)
			error=this.state.error;

		if (error)
			return createElement(this.props.fallback,{error: error});

		return this.props.children;
	}
}

let IsoErrorBoundaryContext=createContext();

export function IsoErrorBoundary({fallback, children, error}) {
	let iso=useIsoContext();
	let [currentError,setCurrentError]=useState(error);

	if (iso.isSsr())
		iso.setErrorFallback(fallback);

	return (
		createElement(IsoErrorBoundaryContext.Provider,{value:setCurrentError},
			createElement(ErrorBoundaryComponent,{fallback: fallback, error: currentError},
				children
			)
		)
	);
}

export function useIsoErrorBoundary() {
	let iso=useIsoContext();
	let throwError=useContext(IsoErrorBoundaryContext);

	if (!throwError)
		return;

	return ((e)=>{
		if (iso.isSsr()) {
			iso.setError(e);
		}

		throwError(e);
	});
}