import Bundler from "isoq/bundler";
import BrowserBundler from "isoq/browser-bundler";
import {createNodeRequestListener} from "serve-fetch";
import http from "http";
import path from "path";
import esbuild from "esbuild";
import fs from "fs";
import os from "os";

/*let bundler=new BrowserBundler(path.resolve("index.jsx"),{
	esbuild: esbuild,
	fsPromises: fs.promises,
	tmpdir: os.tmpdir(),
	isoqdir: path.resolve(process.cwd(),"node_modules/isoq"),
	out: path.resolve(".target/handler.js"),
	quiet: true,
	sourcemap: true
});*/

let bundler=new Bundler("index.jsx",{
	/*esbuild: esbuild,
	fsPromises: fs.promises,
	tmpdir: os.tmpdir(),
	isoqdir: path.resolve(process.cwd(),"node_modules/isoq"),*/
	out: ".target/handler.js",
	ignore: "fs,url,path",
	//minify: false,
	/*quiet: true,*/
	//sourcemap: true
});

await bundler.bundle();

let handler=(await import("./.target/handler.js")).default;

let server=http.createServer(createNodeRequestListener(async req=>{
	return await handler(req,{
		appPathname: "/////////",
		props: {test: 123}
	})
}));

server.listen(3000,()=>{
	console.log("Serving on 3000")
});
