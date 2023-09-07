import IsoqServer from "../isoq/IsoqServer.js";

export default (app)=>{
	if (app && app.req)
		throw new Error("Did you do middleware instead of middleware()");

	let server=new IsoqServer();

	return (async (c, next)=>{
		async function localFetch(req) {
			if (!app)
				throw new Error("Local fetch doesn't work, you need to pass the app!");

			return await app.fetch(req,c.env,c.executionContext);
		}

		let response=await server.handleRequest(c.req.raw, localFetch);
		if (response)
			return response;

		return await next();
	});
}
