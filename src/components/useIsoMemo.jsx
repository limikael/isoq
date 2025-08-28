import {useState, useLayoutEffect} from "preact/hooks";
import {useIsoContext} from "./IsoContext.jsx";
import {useLoadingState} from "./useIsLoading.jsx";
import {useIsoRef} from "./iso-ref.js";

/**
 * An isomorphic memoization hook for asynchronous computations. The value returned by `asyncFn` 
 * is generated on the server during SSR and immediately available on the client, avoiding extra fetches.
 * 
 * On the client, `asyncFn` is "debounced" in the sense that only one active call will be in-flight 
 * at any given time. If the hook is called again while a previous call is still pending, it will 
 * return the last known value until the new result arrives.
 *
 * Note: The returned value must be serializable (plain objects, arrays, primitives), 
 * not class instances or functions.
 *
 * @param {Function} asyncFn - The asynchronous function whose result should be memoized.
 * @param {Array<any>} [deps=[]] - Dependency array; the function re-runs whenever any dependency changes.
 * @param {Object} [options={}] - Optional settings.
 * @param {boolean} [options.shared=true] - Whether the memoized value is shared across all clients.
 * @param {boolean} [options.swr=false] - Enables Stale-While-Refresh: returns the old value immediately 
 *                                        while fetching the new one in the background.
 * @returns {any} - The memoized value, automatically synchronized between server and client.
 *
 */
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

    //console.log("ref: ",ref,"ref status=",ref.current.status);
    /*console.log("ref.current: ",ref.current);*/

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
    //console.log("render... status=",ref.current.status);

    let depsChanged = ref.current.deps === undefined || ref.current.deps!=deps;

    if (depsChanged /*&& ref.status!="error"*/) {
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
                    //console.log("caught error...");
                    ref.current.error = err;
                    ref.current.status = "error";
                })
                .finally(()=>{
                    if (localRef.current.pendingNextRun) {
                        //console.log("running pending...");
                        run();
                    }

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
        //console.log("it s error, throwing...");
        throw ref.current.error;
    }

    return ref.current.result;
}