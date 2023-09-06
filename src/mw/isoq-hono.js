import IsoqServer from "../isoq/IsoqServer.js";

export default (app)=>{
	let server=new IsoqServer();

	return (async (c, next)=>{
		async function localFetch(req) {
			//console.log("doing local fetch...");
			return await app.fetch(req,c.env,c.executionContext);
		}

		let response=await server.handleRequest(c.req.raw, localFetch);
		if (response)
			return response;

		return await next();
	});
}
