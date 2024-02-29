import handleRequest from "./.target/isoq-request-handler.js";

export default {
	async fetch(req) {
		return await handleRequest(req);
	}
}