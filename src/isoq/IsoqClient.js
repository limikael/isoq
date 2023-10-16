export default class IsoqClient {
	constructor(refs) {
		this.refs=refs;
		this.req=new Request(window.location);
	}

	getIsoRef(id) {
		return this.refs[id];
	}

	markIsoRefStale(id) {
		delete this.refs[id];
	}

	isSsr() {
		return false;
	}

	getUrl() {
		return window.location;
	}

	redirect(url) {
		window.location=url;
	}

	fetch=async (url,options={})=>{
		if (url.startsWith("/"))
			url=new URL(this.req.url).origin+url;

		return await fetch(url,options);
	}

	getBarrier(id) {
		return ()=>{};
	}

	unresolveBarrier() {
	}
}