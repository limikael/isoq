import IsoqServer from "../isoq/IsoqServer.js";
import Browser from "@browser";
import clientSource from "@clientSource";
import clientSourceMap from "@clientSourceMap";

let server=new IsoqServer({
	clientSource: clientSource,
	clientModule: Browser,
	clientSourceMap: clientSourceMap
});

export async function handleRequest(req, options) {
	return await server.handleRequest(req,options);
}
