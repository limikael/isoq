import {useIsoRef} from "isoq";

export default function LazyPage() {
	let ref=useIsoRef();
	console.log("rendering lazy page, ref="+ref.current);

	if (!ref.current) {
		ref.current="hello world";
	}

	return (
		<div>this is a lazy page</div>
	);
}