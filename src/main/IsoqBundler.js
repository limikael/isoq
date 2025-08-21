import os from "os";
import path from "node:path";
import {buf2hex, replaceFromSubstring, DeclaredError} from "../utils/js-util.js";
import fs, {promises as fsp} from "node:fs";
import CLIENT_STUB from "./client-stub.js";
import SERVER_STUB from "./server-stub.js";
import esbuild from "esbuild";
import {fileURLToPath} from "url";
import {createRequire} from "node:module";
import {esbuildModuleAlias} from "../utils/esbuild-util.js";
import {vendoredBuild, vendoredContext} from "../utils/vendored-build.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

export default class IsoqBundler {
	constructor({out, tmpdir, entrypoint, inlineBundle, wrappers, 
			minify, quiet, contentdir, splitting, prune,
			sourcemap, sourceRoot, vendor, vendorExclude,
			...more}={}) {
		if (Object.keys(more).length)
			throw new DeclaredError("Unknown options for IsoqBundler: "+Object.keys(more).join(","));

		if (!out)
			out="request-handler.js";

		this.quiet=quiet;
		this.out=path.resolve(out);
		this.entrypoint=path.resolve(entrypoint);

		if (contentdir)
			this.contentdir=path.resolve(contentdir);

		this.tmpdir=tmpdir;
		this.inlineBundle=inlineBundle;
		this.splitting=splitting;
		this.minify=minify;
		if (this.minify===undefined)
			this.minify=true;

		this.prune=prune;
		if (this.prune===undefined)
			this.prune=true;

		this.wrappers=wrappers;
		if (!this.wrappers)
			this.wrappers=[];

		if (typeof this.wrappers=="string")
			this.wrappers=this.wrappers.split(",");

		//Nope, don't resolve...
		//this.wrappers=this.wrappers.map(w=>path.resolve(w));

		this.vendorExclude=vendorExclude;
		if (!this.vendorExclude)
			this.vendorExclude=[];

		if (typeof this.vendorExclude=="string")
			this.vendorExclude=this.vendorExclude.split(",");

		if (this.inlineBundle && this.contentdir)
			throw new DeclaredError("Can't use inlineBundle and contentdir at the same time.");

		if (this.splitting && !this.contentdir)
			throw new Error("Code splitting requires contentdir.");

		if (sourceRoot)
			this.sourceRoot=path.resolve(sourceRoot);

		this.sourcemap=sourcemap;
		this.vendor=vendor;
	}

	async initTmpdir() {
		if (!this.tmpdir) {
			let ostmpdir=os.tmpdir();
			let ab=new TextEncoder("utf-8").encode(this.entrypoint);
			let inHash=buf2hex(await crypto.subtle.digest("SHA-1",ab));
			this.tmpdir=path.join(ostmpdir,"isoq-"+inHash);
		}

		this.tmpdir=path.resolve(this.tmpdir);
	}

	async initBundle() {
		await this.initTmpdir();

		/*if (fs.existsSync(this.tmpdir))
			await fsp.rm(this.tmpdir,{recursive: true, force: true});*/

		await fsp.mkdir(this.tmpdir,{recursive: true});

		let imports="";
		imports+=`import Entrypoint from ${JSON.stringify(this.entrypoint)}\n`;

		for (let i=0; i<this.wrappers.length; i++)
			imports+=`import __Wrapper${i} from ${JSON.stringify(this.wrappers[i])};\n`;

		imports+=`const __wrappers=[${this.wrappers.map((_,i)=>"__Wrapper"+i).join(",")}];\n`;
		imports+="const options="+JSON.stringify({
			sourceRoot: this.sourceRoot,
			sourcemap: this.sourcemap
		})+";\n";

		let s=CLIENT_STUB.replace("$$IMPORTS$$",imports);
		await fsp.writeFile(path.join(this.tmpdir,"client-ssr.jsx"),s);

		s=replaceFromSubstring(s,"/* SSR */","");
		await fsp.writeFile(path.join(this.tmpdir,"client.jsx"),s);

		this.outdir=this.tmpdir;
		if (this.contentdir)
			this.outdir=this.contentdir;

		await fsp.mkdir(this.outdir,{recursive: true});
	}

	async bundle() {
		await this.initBundle();
		await vendoredBuild(this.getBuildOptions());
		await this.postBuild();
	}

	getBuildOptions() {
		let entryPoints=[
			path.join(this.tmpdir,"client.jsx"),
			path.join(this.tmpdir,"client-ssr.jsx")
		];

		return ({
			entryPoints: entryPoints,
			preset: "preact",
			vendor: this.vendor,
			vendorExclude: this.vendorExclude,
			tmpdir: this.tmpdir,
			outdir: this.outdir,
			minify: this.minify,
			splitting: this.splitting,
			chunkNames: "client.[hash]",
			sourcemap: this.sourcemap?"inline":undefined,
			sourceRoot: this.outdir,
			prune: this.prune
		});
	}

	async postBuild() {
		let serverSource=SERVER_STUB;
		serverSource=serverSource.replace("$$CLIENT_MODULE$$",JSON.stringify(path.join(this.outdir,"client-ssr.js")));

		let clientModuleSource=null;
		if (!this.contentdir)
			clientModuleSource=await fsp.readFile(path.join(this.outdir,"client.js"),"utf8");

		serverSource=serverSource.replace("$$CLIENT_SOURCE$$",JSON.stringify(clientModuleSource));
		if (this.sourcemap)
			serverSource=serverSource.replace("$$FS_IMPORT$$",`import fs from "fs";`);

		else
			serverSource=serverSource.replace("$$FS_IMPORT$$",`let fs=null;`);

		let isoqServerImport=path.resolve(__dirname,"../main/server-exports.js");
		serverSource=serverSource.replace("$$ISOQ_SERVER$$",JSON.stringify(isoqServerImport));
		serverSource=serverSource.replace("$$OPTIONS$$",JSON.stringify({
			inlineBundle: this.inlineBundle,
		}));

		await fsp.writeFile(this.out,serverSource);
	}

	async createContext() {
		if (this.buildContext)
			throw new Error("Build context already created");

		await this.initBundle();
		this.buildContext=await vendoredContext(this.getBuildOptions());
	}

	async rebuild() {
		if (!this.buildContext)
			throw new Error("Build context not initialized");

		await this.buildContext.rebuild();
		await this.postBuild();
	}

	async dispose() {
		if (!this.buildContext)
			throw new Error("Can't dispose, no context running...");

		await this.buildContext.dispose();
		this.buildContext=undefined;
	}
}