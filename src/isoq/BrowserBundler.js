import bundlerDefault from "../isoq/bundler-default.js";
import {moduleAlias} from "../utils/esbuild-util.js";
import {mkdirRecursive, exists, rmRecursive} from "../utils/fs-util.js";
import path from "path-browserify";
import {buf2hex} from "../utils/js-util.js";

export default class BrowserBundler {
	constructor(inFile, conf) {
		this.inFile=inFile;
		Object.assign(this,{...bundlerDefault,...conf});

		if (this.wm || this.outdir)
			throw new Error("mw and outdir is obsolete...");

		if (!this.fsPromises || !this.esbuild)
			throw new Error("Need fsPromises and esbuild");

		if (!this.esbuildPlugins)
			this.esbuildPlugins=[];

		if (!path.isAbsolute(this.tmpdir) ||
				!path.isAbsolute(this.isoqdir) ||
				!path.isAbsolute(inFile) ||
				!path.isAbsolute(this.out))
			throw new Error("Need absolute dirs for tmpdir, isoqdir, inFile and out.");
	}

	commonBuildOptions() {
		return {
			jsxFactory: "h",
			jsxFragment: "Fragment",
			inject: [path.join(this.isoqdir,"src/utils/preact-shim.js")],
			format: "esm",
		};
	}

	async bundle() {
		//console.log("******* BUNDLE ******");

		if (await exists(this.fsPromises,this.out))
			await this.fsPromises.unlink(this.out);

		let ab=new TextEncoder("utf-8").encode(this.inFile);
		let inHash=buf2hex(await crypto.subtle.digest("SHA-1",ab));
		this.tmpOutDir=path.join(this.tmpdir,"isoq-"+inHash);

		if (await exists(this.fsPromises,this.tmpOutDir))
			await rmRecursive(this.fsPromises,this.tmpOutDir)

		await mkdirRecursive(this.fsPromises,this.tmpOutDir);

		if (this.splitting && !this.contentdir)
			throw new Error("Code splitting requires contentdir.");

		if (this.contentdir) {
			if (!path.isAbsolute(this.contentdir))
				throw new Error("Content dir is not absolute");

			this.clientOutDir=this.contentdir;
			await mkdirRecursive(this.fsPromises,this.clientOutDir);
		}

		else
			this.clientOutDir=this.tmpOutDir;

		await this.bundleClient();
		await this.bundleHandler();

		this.log("Middleware "+
			(this.sourcemap?"with sourcemap":"without sourcemap")+
			" generated in: "+this.out
		);

		if (this.contentdir)
			this.log("Client javascript assets in: "+this.contentdir);

		else
			this.log("The middleware includes javascript assets.")
	}

	async bundleClient() {
		this.log("Bundling client...");

		let result=await this.esbuild.build({
			...this.commonBuildOptions(),
			entryPoints: [path.join(this.isoqdir,"src/isoq/client.jsx")],
			outdir: this.clientOutDir,
			bundle: true,
			write: false,
			splitting: this.splitting,
			minify: this.minify,
			sourcemap: this.sourcemap,
			plugins: [
				moduleAlias({
					"@browser": this.inFile,
					"react": "preact/compat",
					"react-dom": "preact/compat",
					"react/jsx-runtime": "preact/jsx-runtime"
				}),
				...this.esbuildPlugins,
			],
		});

		if (result.errors.length)
			throw new Error(result.errors);

		for (let outputFile of result.outputFiles) {
			await this.fsPromises.writeFile(
				outputFile.path,
				outputFile.contents
			)
		}

		if (!this.contentdir)
			await this.sourcify(
				path.join(this.clientOutDir,"client.js"),
				path.join(this.tmpOutDir,"client.src.js")
			);

		if (this.sourcemap)
			await this.sourcify(
				path.join(this.clientOutDir,"client.js.map"),
				path.join(this.tmpOutDir,"client.src.map.js")
			);
	}

	async sourcify(fn, target) {
		let source=await this.fsPromises.readFile(fn,"utf8");
		await this.fsPromises.writeFile(
			target,
			`export default ${JSON.stringify(source)};`
		);
	}

	async bundleHandler() {
		this.log("Bundling request handler...");
		let runtimeOptions={
			sourcemap: this.sourcemap,
			sourcemapFile: this.out+".map",
			sourcemapRoot: this.clientOutDir,
		};

		await this.fsPromises.writeFile(
			path.join(this.tmpOutDir,"global-options.js"),
			`globalThis.__ISOQ_OPTIONS=${JSON.stringify(runtimeOptions)}`
		);

		let handlerExternal=["source-map","fs","path","url"];
		let handlerAlias={
			"@browser": this.inFile,
			"react": "preact/compat",
			"react-dom": "preact/compat",
			"react/jsx-runtime": "preact/jsx-runtime",
		};

		if (this.contentdir)
			handlerAlias["@clientSource"]=path.join(this.isoqdir,"src/utils/null.js");

		else
			handlerAlias["@clientSource"]=path.join(this.tmpOutDir,"client.src.js");

		if (this.sourcemap) {
			handlerExternal=["source-map","fs","path","url"];
			handlerAlias["@clientSourceMap"]=path.join(this.tmpOutDir,"client.src.map.js");
		}

		else {
			handlerExternal=[];
			handlerAlias["@clientSourceMap"]=path.join(this.isoqdir,"src/utils/null.js");
			handlerAlias["isoq/source-mapper-node"]=path.join(this.isoqdir,"src/utils/null.js");
		}

		let result=await this.esbuild.build({
			...this.commonBuildOptions(),
			entryPoints: [path.join(this.isoqdir,"src/isoq/isoq-request-handler.js")],
			inject: [
				...this.commonBuildOptions().inject,
				path.join(this.tmpOutDir,"global-options.js")
			],
			outfile: this.out,
			write: false,
			bundle: true,
			minify: this.minify,
			sourcemap: this.sourcemap,
			external: handlerExternal,
			plugins: [
				moduleAlias(handlerAlias),
				...this.esbuildPlugins,
			],
		});

		if (result.errors.length)
			throw new Error(result.errors);

		await mkdirRecursive(this.fsPromises,path.dirname(this.out));
		for (let outputFile of result.outputFiles) {
			await this.fsPromises.writeFile(
				outputFile.path,
				outputFile.contents
			)
		}
	}

	log(...args) {
		if (!this.quiet)
			console.log(...args);
	}
}