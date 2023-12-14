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

export function waitEvent(o, event) {
	return new Promise(resolve=>{
		function listener() {
			o.removeEventListener(event,listener);
			resolve();
		}

		o.addEventListener(event,listener);
	});
}

export function parseCookie(str) {
	if (!str)
		return {};

	return (
	  	str
		    .split(';')
		    .map(v => v.split('='))
		    .reduce((acc, v) => {
		    	if (v.length==2)
					acc[decodeURIComponent(v[0].trim())] = decodeURIComponent(v[1].trim());

				return acc;
		    }, {})
	)
}

export function stringifyCookie(key, value, options={}) {
	let s=encodeURIComponent(key)+"="+encodeURIComponent(value)+";";
	if (options.expires)
		s+="expires="+new Date(options.expires).toUTCString()+";";

	if (options.path)
		s+="path="+options.path+";"

	else
		s+="path=/;"

	return s;
}