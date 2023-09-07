export default class IsoqClient {
	constructor(data) {
		this.data=data;
		this.req=new Request(window.location);
	}

	isSsr() {
		return false;
	}

	getData(id) {
		return this.data[id]
	}

	async fetch(url,options={}) {
		if (url.startsWith("/"))
			url=new URL(this.req.url).origin+url;

		return await fetch(url,options);
	}
}