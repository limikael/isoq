import bundlerDefault from "../isoq/bundler-default.js";
import {esbuildModuleAlias, esbuildIgnorePaths, esbuildFileContents} from "../utils/esbuild-util.js";
import {mkdirRecursive, exists, rmRecursive, findInPath} from "../utils/fs-util.js";
import path from "path-browserify";
import {buf2hex} from "../utils/js-util.js";
import {minimatch} from "minimatch";

export class BrowserBundler {
	constructor(conf) {
		Object.assign(this,{...bundlerDefault,...conf});

		if (typeof this.ignore=="string")
			this.ignore=this.ignore.split(",");

		if (!this.ignore)
			this.ignore=[];

		if (this.wm || this.outdir)
			throw new Error("mw and outdir is obsolete...");

		if (!this.fs)
			throw new Error("Need fs");

		if (!this.esbuild)
			throw new Error("Need esbuild");

		if (!this.esbuildPlugins)
			this.esbuildPlugins=[];

		if (this.pathAliases===undefined)
			this.pathAliases=true;

		if (!path.isAbsolute(this.tmpdir) ||
				!path.isAbsolute(this.isoqdir) ||
				!path.isAbsolute(this.entrypoint) ||
				!path.isAbsolute(this.out))
			throw new Error("Need absolute dirs for tmpdir, isoqdir, entrypoint and out.");

		for (let w of this.wrappers)
			if (!path.isAbsolute(w))
				throw new Error("Need absolute dirs for wrappers.");
	}

	getWrappersSource() {
		let s="";

		for (let i=0; i<this.wrappers.length; i++)
			s+=`import __Wrapper${i} from ${JSON.stringify(this.wrappers[i])};\n`;

		s+=`export default [${this.wrappers.map((_,i)=>"__Wrapper"+i).join(",")}];\n`;

		return s;
	}

	async getModuleAliases() {
		if (!this.pathAliases)
			return {};

		let preactPath=await findInPath(this.isoqdir,"node_modules/preact",{fs: this.fs});
		//console.log("preact path: "+preactPath);

		return {
			"isoq": path.join(this.isoqdir,"src/main/main.js"),

			"preact": path.join(preactPath,"dist/preact.module.js"),
			"preact/hooks": path.join(preactPath,"hooks/dist/hooks.module.js"),
			"preact/jsx-runtime": path.join(preactPath,"jsx-runtime/dist/jsxRuntime.module.js"),
			"react": path.join(preactPath,"compat/dist/compat.module.js"),
			"react-dom": path.join(preactPath,"compat/dist/compat.module.js"),
			"react/jsx-runtime": path.join(preactPath,"jsx-runtime/dist/jsxRuntime.module.js"),

			// doesn't work when build is running in browser
			/*"preact": preactPath,
			"preact/hooks": path.join(preactPath,"hooks"),
			"react": path.join(preactPath,"compat"),
			"react-dom": path.join(preactPath,"compat"),
			"react/jsx-runtime": path.join(preactPath,"jsx-runtime")*/

			// old
			/*"react": "preact/compat",
			"react-dom": "preact/compat",
			"react/jsx-runtime": "preact/jsx-runtime"*/
		}
	}

	commonBuildOptions() {
		return {
//			jsxFactory: "h",
//			jsxFragment: "Fragment",
//			inject: [path.join(this.isoqdir,"src/utils/preact-shim.js")],
			inject: [],
			format: "esm",
			jsx: 'automatic',
			jsxImportSource: 'preact',
		};
	}

	async bundle() {
		if (!await exists(path.dirname(this.out),{fs:this.fs}))
			await this.fs.promises.mkdir(path.dirname(this.out),{recursive: true});

		if (await exists(this.out,{fs:this.fs}))
			await this.fs.promises.unlink(this.out);

		let ab=new TextEncoder("utf-8").encode(this.entrypoint);
		let inHash=buf2hex(await crypto.subtle.digest("SHA-1",ab));
		this.tmpOutDir=path.join(this.tmpdir,"isoq-"+inHash);

		if (await exists(this.tmpOutDir,{fs:this.fs}))
			await rmRecursive(this.tmpOutDir,{fs:this.fs})

		await mkdirRecursive(this.tmpOutDir,{fs:this.fs});

		if (this.splitting && !this.contentdir)
			throw new Error("Code splitting requires contentdir.");

		if (this.contentdir) {
			if (!path.isAbsolute(this.contentdir))
				throw new Error("Content dir is not absolute");

			this.clientOutDir=this.contentdir;
			await mkdirRecursive(this.clientOutDir,{fs:this.fs});

			if (this.purgeOldJs) {
				let files=await this.fs.promises.readdir(this.clientOutDir);
				for (let file of files) {
					if (minimatch(file,"client.*.js"))
						await this.fs.promises.rm(path.join(this.clientOutDir,file));
				}
			}
		}

		else
			this.clientOutDir=this.tmpOutDir;

		await this.bundleClient();
		await this.bundleHandler();

		this.log("Middleware "+
			(this.sourcemap?"with sourcemap, ":"without sourcemap, ")+
			(this.exposeExports?"with exposed exports":"without exposed exports")+
			" generated in: "+this.out
		);

		if (this.contentdir)
			this.log("Client javascript assets in: "+this.contentdir);

		else
			this.log("The middleware includes javascript assets.")
	}

	async bundleClient() {
		this.log("Bundling client...");

		let entryPoints=[path.join(this.isoqdir,"src/isoq/client.jsx")];
		if (this.exposeExports)
			entryPoints=[path.join(this.isoqdir,"src/expose/client.jsx")];

		let result=await this.esbuild.build({
			...this.commonBuildOptions(),
			entryPoints: entryPoints,
			outdir: this.clientOutDir,
			bundle: true,
			write: false,
			chunkNames: "client.[hash]",
			splitting: this.splitting,
			minify: this.minify,
			sourcemap: this.sourcemap,
			plugins: [
				esbuildIgnorePaths(this.ignore),
				esbuildFileContents({"@wrappers": this.getWrappersSource()},{resolveDir: path.dirname(this.out)}),
				esbuildModuleAlias({
					"@browser": this.entrypoint,
					...await this.getModuleAliases()
				}),
				...this.esbuildPlugins,
			],
		});

		if (result.errors.length)
			throw new Error(result.errors);

		for (let outputFile of result.outputFiles) {
			await this.fs.promises.writeFile(
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
		let source=await this.fs.promises.readFile(fn,"utf8");
		await this.fs.promises.writeFile(
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
			inlineBundle: this.inlineBundle
		};

		await this.fs.promises.writeFile(
			path.join(this.tmpOutDir,"global-options.js"),
			`globalThis.__ISOQ_OPTIONS=${JSON.stringify(runtimeOptions)}`
		);

		let handlerExternal=["source-map","fs","path","url"];
		let handlerAlias={
			"@browser": this.entrypoint,
			...await this.getModuleAliases()
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

		let entryPoints=[path.join(this.isoqdir,"src/isoq/isoq-request-handler.js")];
		if (this.exposeExports)
			entryPoints=[path.join(this.isoqdir,"src/expose/isoq-request-handler.js")];

		let result=await this.esbuild.build({
			...this.commonBuildOptions(),
			entryPoints: entryPoints,
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
				esbuildIgnorePaths(this.ignore),
				esbuildFileContents({"@wrappers": this.getWrappersSource()},{resolveDir: path.dirname(this.out)}),
				esbuildModuleAlias(handlerAlias),
				...this.esbuildPlugins,
			],
		});

		if (result.errors.length)
			throw new Error(result.errors);

		await mkdirRecursive(path.dirname(this.out),{fs:this.fs});
		for (let outputFile of result.outputFiles) {
			await this.fs.promises.writeFile(
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

export async function isoqBundle(conf) {
	let bundler=new BrowserBundler(conf);
	await bundler.bundle();
}

export async function isoqGetEsbuildOptions(conf) {
	let preactPath=await findInPath(conf.isoqdir,"node_modules/preact",{fs: conf.fs});
	return ({
		format: "esm",
		jsx: 'automatic',
		jsxImportSource: 'preact',
		plugins: [
			esbuildModuleAlias({
				"preact": path.join(preactPath,"dist/preact.module.js"),
				"preact": path.join(preactPath,"dist/preact.module.js"),
				"preact/hooks": path.join(preactPath,"hooks/dist/hooks.module.js"),
				"preact/jsx-runtime": path.join(preactPath,"jsx-runtime/dist/jsxRuntime.module.js"),
				"react": path.join(preactPath,"compat/dist/compat.module.js"),
				"react-dom": path.join(preactPath,"compat/dist/compat.module.js"),
				"react/jsx-runtime": path.join(preactPath,"jsx-runtime/dist/jsxRuntime.module.js"),
			})
		],
		bundle: true
	});
}
