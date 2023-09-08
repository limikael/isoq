import IsoqServer from "../isoq/IsoqServer.js";

export default (conf)=>{
	if (conf && conf.req)
		throw new Error("Did you do middleware instead of middleware()");

	let server=new IsoqServer();

	return (async (c, next)=>{
		async function localFetch(req) {
			if (!conf.localFetch)
				throw new Error("Local fetch doesn't work, you need to pass the app!");

			return await conf.localFetch(req,c.env,c.executionContext);
		}

		let response=await server.handleRequest(c.req.raw, localFetch, conf.props);
		if (response)
			return response;

		return await next();
	});
}
