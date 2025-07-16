import {useIsoRef, IsoRefState, IsoRefContext} from "../../src/utils/iso-ref.js";
import {render as renderToString} from 'preact-render-to-string';
import {h} from "preact";

describe("isoref",()=>{
	it("works",async ()=>{
		function Comp() {
			let ref=useIsoRef();

			if (!ref.current)
				ref.current="hello";

			return "current: "+ref.current
		}

		let isoRefState=new IsoRefState();

		let t=
			h(IsoRefContext.Provider,{value: isoRefState},[
				h(Comp)
			]);

		let out=renderToString(t);
		expect(out).toEqual("current: hello");
		expect(isoRefState.refs["C0/C0#1"].current).toEqual("hello");

		isoRefState.refs["C0/C0#1"].current="another"

		out=renderToString(t);
		expect(out).toEqual("current: another");

		expect(isoRefState.getSharedRefValues()).toEqual({"C0/C0#1": "another"});
	});

	it("can populate the state on init",async ()=>{
		function Comp() {
			let ref=useIsoRef();

			if (!ref.current)
				ref.current="hello";

			return "current: "+ref.current
		}

		let isoRefState=new IsoRefState({initialRefValues:{
			"C0/C0#1": "another"
		}});

		let t=
			h(IsoRefContext.Provider,{value: isoRefState},[
				h(Comp)
			]);

		let out=renderToString(t);
		out=renderToString(t);
		expect(out).toEqual("current: another");
	});
});