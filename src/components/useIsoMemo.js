import {useState} from "preact/hooks";
import {useIsoContext} from "../isoq/IsoContext.js";
import {useIsoRef} from "../utils/iso-ref.js";

export function useIsoMemo(asyncFn, deps=[], options={}) {
    let iso=useIsoContext();
    let [, forceUpdate]=useState({});

    let ref=useIsoRef({
        result: undefined,
        error: undefined,
        status: "idle",
        deps: undefined,
    },{shared: options.shared});

    //console.log("ref: ",ref);

    let localRef=useIsoRef({
        promise: null,
        pendingNextRun: false,
    },{shared: false});


    if (iso.isSsr() && options.server===false)
        return;

    deps=JSON.stringify(deps);
    let depsChanged = ref.current.deps === undefined || ref.current.deps!=deps;

    if (depsChanged) {
        if (iso.hydration) {
            console.log("yep, hydration");
            // Skip execution on hydration; trigger re-render post hydration
            setTimeout(() => forceUpdate({}), 0);
            return;
        }

        ref.current.deps = deps;

        if (ref.current.status === "pending") {
            // A request is running; mark to rerun after it completes
            localRef.current.pendingNextRun = true;
        } else {
            ref.current.status = "pending";
            localRef.current.promise = asyncFn()
                .then(result => {
                    ref.current.result = result;
                    ref.current.status = "success";
                })
                .catch(err => {
                    ref.current.error = err;
                    ref.current.status = "error";
                })
                .finally(() => {
                    if (localRef.current.pendingNextRun) {
                        localRef.current.pendingNextRun = false;
                        ref.current.status = "pending";
                        localRef.current.promise = asyncFn()
                            .then(result => {
                                ref.current.result = result;
                                ref.current.status = "success";
                            })
                            .catch(err => {
                                ref.current.error = err;
                                ref.current.status = "error";
                            });
                    }
                });
        }
    }

    if (ref.current.status === "pending") {
        throw localRef.current.promise;
    }

    if (ref.current.status === "error") {
        throw ref.current.error;
    }

    return ref.current.result;
}