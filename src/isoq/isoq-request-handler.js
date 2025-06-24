import {IsoqServer} from "isoq/server-internals";
import Browser from "@browser";
import wrappers from "@wrappers";
import clientSource from "@clientSource";
import clientSourceMap from "@clientSourceMap";

let server=new IsoqServer({
	clientSource: clientSource,
	clientModule: Browser,
	clientSourceMap: clientSourceMap,
	wrappers: wrappers
});

export async function handleRequest(req, options) {
	return await server.handleRequest(req,options);
}

export default handleRequest;
