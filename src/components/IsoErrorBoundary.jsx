import {Component} from "preact";
import {useState} from "preact/hooks";
import {useIsoContext} from "./IsoContext.jsx";

export function DefaultErrorFallback({error}) {
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

    return <div style={style}>{message}</div>
}

class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, info) {
        if (this.props.onError) {
            this.props.onError(error, info);
        }
    }

    render(_, state) {
        if (state.hasError) {
            return this.props.fallback ?? null;
        }
        return this.props.children;
    }
}

export function IsoErrorBoundary({fallback, children}) {
    let [error,setError]=useState();
    let iso=useIsoContext();

    iso.errorFallback=fallback;

    function handleError(e) {
        setError(e);
    }

    let Fallback=fallback;

    if (error)
        return <Fallback error={error}/>

    return (
        <ErrorBoundary onError={handleError}>
            {children}
        </ErrorBoundary>
    );
}