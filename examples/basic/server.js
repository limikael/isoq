import requestHandler from "./request-handler.js";
import {createNodeRequestListener} from "serve-fetch";
import http from "http";
import fs, {promises as fsp} from "fs";
import {createStaticResponse} from "./node-util.js";

let listener=createNodeRequestListener(async request=>{
	let staticResponse=await createStaticResponse({request, cwd: "public"});
	//console.log(staticResponse);

	if (staticResponse)
		return staticResponse;

	try {
		return requestHandler(request,{props: {hello: "world"}});
	}

	catch (e) {
		console.log(e);
		throw e;
	}
});

let server=http.createServer(listener);
server.listen(3000,()=>console.log("Listening..."));