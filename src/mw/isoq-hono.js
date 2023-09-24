import IsoqServer from "../isoq/IsoqServer.js";
import Browser from "@browser";
import clientSource from "@clientSource";

export default (conf={})=>{
	if (conf.req)
		throw new Error("Did you do middleware instead of middleware()");

	let server=new IsoqServer({
		clientSource: clientSource,
		clientModule: Browser,
	});

	return (async (c, next)=>{
		async function localFetch(req) {
			if (!conf.localFetch)
				throw new Error("Local fetch doesn't work, you need to pass the app!");

			return await conf.localFetch(req,c.env,c.executionContext);
		}

		let response=await server.handleRequest(c.req.raw, {
			localFetch, 
			props: conf.props,
			setGlobalLocation: conf.setGlobalLocation
		});

		if (response)
			return response;

		return await next();
	});
}
