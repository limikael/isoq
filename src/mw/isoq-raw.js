import IsoqServer from "../isoq/IsoqServer.js";
import Browser from "@browser";
import clientSource from "@clientSource";

let server=new IsoqServer({
	clientSource: clientSource,
	clientModule: Browser
});

export async function handleRequest(req, options) {
	return await server.handleRequest(req,options);
}
