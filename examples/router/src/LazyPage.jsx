import {useIsoRef, useIsoId} from "isoq";

export default function LazyPage() {
	/*let id=useIsoId();
	console.log("lazyid: "+id);*/

	let ref=useIsoRef();
	console.log("rendering lazy page, ref="+ref.current);

	if (!ref.current) {
		console.log("setting iso ref...");
		ref.current="hello world";
	}

	return (
		<p>this is a lazy page</p>
	);
}