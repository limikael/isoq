export function jsonEq(a,b) {
	return (JSON.stringify(a)==JSON.stringify(b));
}

export function splitPath(pathname) {
	if (pathname===undefined)
		throw new Error("Undefined pathname");

	return pathname.split("/").filter(s=>s.length>0);
}

export function urlMatchPath(url, path) {
	if (!url)
		return;

	let u=new URL(url);
	let urlSplit=splitPath(u.pathname);
	let pathSplit=splitPath(path);

	if (urlSplit.length!=pathSplit.length)
		return false;

	for (let i=0; i<urlSplit.length; i++)
		if (urlSplit[i]!=pathSplit[i] && pathSplit[i]!="*")
			return false;

	return true;	
}
