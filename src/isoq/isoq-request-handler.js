//import IsoqServer from "../isoq/IsoqServer.js";
import {IsoqServer} from "isoq/server-internals";
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

export default handleRequest;
