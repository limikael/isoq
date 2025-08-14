import {Component} from "preact";
import {useEffect, useState} from "preact/hooks";
import {useIsoContext} from "./IsoContext.jsx";
import {TraceMap, originalPositionFor} from '@jridgewell/trace-mapping';
import path from "path-browserify";

function StackTraceLine({line, orig, source}) {
    if (line)
        return (<>{line}<br/></>);

    return (<>
        {"    at "}
        <a href={`file://${orig.source}`} style={{color: "#ff0000"}}>
            {source}
        </a>
        {`:${orig.line}:${orig.column}`}
        <br/>
    </>);
}

export function mapError(error, traceMap, sourceRoot) {
    let stackLines=error.stack.split("\n");
    let resultLines=[];

    for (let line of stackLines) {
        const m=line.match(/:(\d+):(\d+)\)?$/);
        if (m) {
            if (traceMap) {
                const [, lineNumStr, colNumStr] = m;
                const lineNum=parseInt(lineNumStr, 10);
                const colNum=parseInt(colNumStr, 10);
                const orig=originalPositionFor(traceMap, { line: lineNum, column: colNum });

                if (orig.source) {
                    let source=orig.source;
                    if (sourceRoot)
                        source=path.relative(sourceRoot,source);

                    if (!source.includes("node_modules"))
                        orig.formatted=<StackTraceLine orig={orig} source={source}/>

                    resultLines.push(orig);
                }
            }

            else {
                resultLines.push({
                    formatted: <StackTraceLine line={line}/>
                });
            }

        }
    }

    return resultLines;
}

function extractSourceMap(source) {
    let match=source.match(/\/\/# sourceMappingURL=data:application\/json[^,]+base64,([A-Za-z0-9+/=]+)/);
    if (!match) throw new Error('No inline sourcemap found');
    let mapJson=JSON.parse(atob(match[1]));
    return mapJson;
}

function useProcessBundle(fn) {
    let iso=useIsoContext();
    let [asyncRes,setAsyncRes]=useState();

    useEffect(()=>{
        if (iso.isSsr())
            return;

        async function run() {
            setAsyncRes(fn(await iso.loadBundleAsync()));
        }

        run();
    },[]);

    if (iso.isSsr()) {
        return fn(iso.loadBundleSync());
    }

    return asyncRes;
}

function useStackTrace(error) {
    let iso=useIsoContext();
    let traceLines=useProcessBundle(bundleSource=>{
        if (!iso.sourcemap)
            return mapError(error);

        let traceMap=new TraceMap(extractSourceMap(bundleSource));
        return mapError(error,traceMap,iso.sourceRoot);
    });

    return traceLines||[];
}

function FormatError({error}) {
    const name = error.name || "Error";
    const message = error.message || "";
    const header = message ? `${name}: ${message}` : name;
    let traceLines=useStackTrace(error);

    return (<>
        {header}<br/>
        {traceLines.filter(l=>!!l.formatted).map(l=>l.formatted)}
    </>);
}

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

    return (
        <div style={style}>
            <FormatError error={error}/>
        </div>
    );
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