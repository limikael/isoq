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

			if (c.req.raw.headers.get("cookie"))
				req.headers.set("cookie",c.req.raw.headers.get("cookie"));

			//console.log("local fetch: "+req.url);
			//console.log("local fetch headers: ",req.headers);
			//console.log("original headers:: ",c.req.raw.headers);

			return await conf.localFetch(req,c.env,c.executionContext);
		}

		try {
			let props=conf.props;
			if (typeof props=="function")
				props=await props(c);

			let response=await server.handleRequest(c.req.raw, {
				localFetch, 
				props: props,
				setGlobalLocation: conf.setGlobalLocation
			});

			if (response)
				return response;
		}

		catch (e) {
			console.log(e);

			return new Response(e.stack,{
				status: 500
			});
		}

		return await next();
	});
}
