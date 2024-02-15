import handleRequest from "__ISOQ_MIDDLEWARE"

export default {
	fetch(req) {
		return handleRequest(req);
	}
}