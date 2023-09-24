export default class IsoqClient {
	constructor(data, deps) {
		this.data=data;
		this.deps=deps;
		this.req=new Request(window.location);
	}

	isSsr() {
		return false;
	}

	markIsoDataStale(id) {
		delete this.data[id];
		delete this.deps[id];
	}

	getData(id) {
		return this.data[id];
	}

	getDeps(id) {
		return this.deps[id];
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
}