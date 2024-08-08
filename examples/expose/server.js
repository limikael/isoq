import {createNodeRequestListener} from "serve-fetch";
import requestHandler from "./.target/isoq-request-handler.js";
import http from "http";

// requires exposed exports
import {react, renderToString} from "./.target/isoq-request-handler.js";
import * as mod from "./.target/isoq-request-handler.js";
console.log(renderToString(react.createElement("div",{},[react.createElement(mod.MyComp)])));

async function fetch(req) {
	return await requestHandler(req);
}

let server=http.createServer(createNodeRequestListener(fetch));
server.listen(3000,()=>console.log("Listening to port 3000..."));
