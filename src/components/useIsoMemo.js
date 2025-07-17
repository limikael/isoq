import {useState, useLayoutEffect} from "preact/hooks";
import {useIsoContext} from "../isoq/IsoContext.js";
import {useLoadingState} from "../components/useIsLoading.js";
import {useIsoRef} from "../utils/iso-ref.js";

export function useIsoMemo(asyncFn, deps=[], options={}) {
    let loadingState=useLoadingState();
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
        fn: undefined
    },{shared: false});

    useLayoutEffect(()=>{
        localRef.mounted=true;
        return ()=>{
            localRef.mounted=false;
        }
    });

    if (iso.isSsr() && options.server===false)
        return;

    localRef.current.fn=asyncFn;

    deps=JSON.stringify(deps);
    //console.log("deps: "+deps);

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
            localRef.current.pendingNextRun = true;
        } 

        else {
            loadingState.updateCount(1);
            function run() {
                ref.current.status = "pending";
                localRef.current.pendingNextRun = false;
                localRef.current.promise=localRef.current.fn();
                localRef.current.promise.then(result => {
                    ref.current.result = result;
                    ref.current.status = "success";
                    if (localRef.mounted)
                        forceUpdate({});
                })
                .catch(err => {
                    console.log("caught...");
                    ref.current.error = err;
                    ref.current.status = "error";
                })
                .finally(()=>{
                    if (localRef.current.pendingNextRun)
                        run();

                    else
                        loadingState.updateCount(-1);
                });
            }

            run();
        }
    }

    if (ref.current.status === "pending") {
        if (localRef.mounted) {
            if (options.swr===false)
                return undefined;

            return ref.current.result;
        }

        throw localRef.current.promise;
    }

    if (ref.current.status === "error") {
        throw ref.current.error;
    }

    return ref.current.result;
}