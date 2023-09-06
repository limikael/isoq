import {useIso} from "./isomorphic.js";

async function _fetchEx(url, options) {
	if (url.startsWith("/")) {
		if (typeof global!=="undefined") {
			url=global.location.origin+url;
			let req=new Request(url,options);
			return await global.__localFetch(req);
		}

		else {
			url=window.location.origin+url;
		}
	}

	return await fetch(url,options);
}

export async function fetchEx(url, options={}) {
	let response=await _fetchEx(url,options);

	switch (options.decode) {
		case "json":
			return await response.json();
			break;

		case "text":
			return await response.text();
			break;
	}

	return response;
}

export function useIsoFetch(url, options={}) {
	let res=useIso(async ()=>{
		return await fetchEx(url,options);
	});

	return res;
}