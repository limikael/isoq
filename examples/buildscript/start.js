import Bundler from "isoq/bundler";
import {createNodeRequestListener} from "serve-fetch";
import http from "http";

let bundler=new Bundler("index.jsx",{
	out: ".target/handler.js",
	quiet: true
});

await bundler.bundle();
let handler=(await import("./.target/handler.js")).default;

let server=http.createServer(createNodeRequestListener(handler));
server.listen(3000,()=>{
	console.log("Serving on 3000")
});
