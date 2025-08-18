import os from "os";
import path from "node:path";
import {buf2hex, replaceFromSubstring, DeclaredError} from "../utils/js-util.js";
import fs, {promises as fsp} from "node:fs";
import CLIENT_STUB from "./client-stub.js";
import SERVER_STUB from "./server-stub.js";
import esbuild from "esbuild";
import {fileURLToPath} from "url";
import {createRequire} from "node:module";
import {minimatch} from "minimatch";
import {esbuildModuleAlias} from "../utils/esbuild-util.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

export function isoqGetEsbuildOptions(conf={}) {
	let isoqPath=path.resolve(__dirname,"../..");
	let preactPath=path.dirname(require.resolve("preact/package.json"));
	let preactRenderToStringPath=path.dirname(require.resolve("preact-render-to-string/package.json"));

	return ({
		format: "esm",
		bundle: true,
		jsx: 'automatic',
		jsxImportSource: 'preact',
		plugins: [
			esbuildModuleAlias({
				"isoq/*": isoqPath,
				"preact/*": preactPath,
				"preact-render-to-string": preactRenderToStringPath,
				"react": "preact/compat",
				"react-dom": "preact/compat",
				"react/jsx-runtime": "preact/jsx-runtime",
			})
		]
	})
}

export default class IsoqBundler {
	constructor({out, tmpdir, entrypoint, inlineBundle, wrappers, 
			minify, quiet, contentdir, splitting, purgeOldJs,
			sourcemap, sourceRoot,
			...more}={}) {
		if (Object.keys(more).length)
			throw new DeclaredError("Unknown options for IsoqBundler: "+Object.keys(more).join(","));

		if (!out)
			out="request-handler.js";

		this.purgeOldJs=purgeOldJs;
		this.quiet=quiet;
		this.out=path.resolve(out);
		this.entrypoint=path.resolve(entrypoint);

		if (contentdir)
			this.contentdir=path.resolve(contentdir);

		this.tmpdir=tmpdir;
		this.inlineBundle=inlineBundle;
		this.minify=minify;

		if (!this.minify===undefined)
			this.minify=true;

		this.wrappers=wrappers;
		if (!this.wrappers)
			this.wrappers=[];

		if (typeof this.wrappers=="string")
			this.wrappers=this.wrappers.split(",");

		this.wrappers=this.wrappers.map(w=>path.resolve(w));
		this.splitting=splitting;

		if (this.inlineBundle && this.contentdir)
			throw new DeclaredError("Can't use inlineBundle and contentdir at the same time.");

		if (this.splitting && !this.contentdir)
			throw new Error("Code splitting requires contentdir.");

		if (sourceRoot)
			this.sourceRoot=path.resolve(sourceRoot);

		this.sourcemap=sourcemap;
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
	}

	async bundle() {
		await this.initBundle();

		let entryPoints=[
			path.join(this.tmpdir,"client.jsx"),
			path.join(this.tmpdir,"client-ssr.jsx")
		];

		let outdir=this.tmpdir;
		if (this.contentdir) {
			await fsp.mkdir(this.contentdir,{recursive: true});
			outdir=this.contentdir;

			if (this.purgeOldJs) {
				let files=await fsp.readdir(this.contentdir);
				for (let file of files) {
					if (minimatch(file,"client.*.js"))
						await fsp.rm(path.join(this.contentdir,file));
				}
			}
		}

		await esbuild.build({
			...isoqGetEsbuildOptions(),
			format: "esm",
			entryPoints: entryPoints,
			outdir: outdir,
			bundle: true,
			minify: this.minify,
			splitting: this.splitting,
			chunkNames: "client.[hash]",
			sourcemap: this.sourcemap?"inline":undefined,
			sourceRoot: outdir,
		});

		let serverSource=SERVER_STUB;
		serverSource=serverSource.replace("$$CLIENT_MODULE$$",JSON.stringify(path.join(outdir,"client-ssr.js")));

		let clientModuleSource=null;
		if (!this.contentdir)
			clientModuleSource=await fsp.readFile(path.join(outdir,"client.js"),"utf8");
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
}