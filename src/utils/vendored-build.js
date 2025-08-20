import esbuild from "esbuild";
import fs, {promises as fsp} from "fs";
import path from "node:path";
import {readPackageUp, readPackageUpSync} from 'read-package-up';
import {createRequire} from "node:module";
import {fileURLToPath} from "url";
import {esbuildModuleAlias} from "./esbuild-util.js";
import {minimatch} from "minimatch";

const __dirname=path.dirname(fileURLToPath(import.meta.url));
const require=createRequire(import.meta.url);

function getPackageByImportPath(importPath) {
	// Relative or absolute imports are not packages
	if (importPath.startsWith(".") || importPath.startsWith("/")) {
		return undefined;
	}

	const parts = importPath.split("/");

	// Scoped package: @scope/name[/...]
	if (importPath.startsWith("@")) {
		if (parts.length >= 2) {
		  return parts.slice(0, 2).join("/");
		}
		return importPath; // e.g. "@scope"
	}

	// Regular package: name[/...]
	return parts[0];
}

function isEsm(importPath, entryPoints) {
	for (let entryPoint of entryPoints) {
		let require=createRequire(entryPoint);
		let fn=require.resolve(importPath);
		let pkgJson=readPackageUpSync({cwd: fn});

		if (pkgJson) {
			let pkg=pkgJson.packageJson;

			if (pkg.type=="module")
				return true;

			if (pkg.exports)
				return true;

			if (pkg.module || pkg.esnext)
				return true;

			if (pkg.main && pkg.main.endsWith(".mjs"))
				return true;
		}
	}
}

function collectVendors(vendorEsbuild) {
	return ({
		name: "collectvendors",
		setup: (build)=>{
			build.onResolve({filter: /.*/},ev=>{
				let pkg=getPackageByImportPath(ev.path);
				if (!pkg)
					return;

				//console.log("************ vendorEsbuild.vendorPackages ",vendorEsbuild.vendorPackages);

				if (!vendorEsbuild.vendorPackages.includes(ev.path) &&
						!vendorEsbuild.vendorCands.includes(pkg))
					return;

				if (vendorEsbuild.vendorExclude.includes(ev.path))
					return;

				if (!vendorEsbuild.vendorPackages.includes(ev.path)) {
					/*if (!isEsm(ev.path,vendorEsbuild.options.entryPoints))
						return;*/

					vendorEsbuild.vendorPackages.push(ev.path);
				}

				//console.log("**** returning...");

				return {
					path: vendorEsbuild.getVendorPath(ev.path,".js"),
					external: true
				}
			});
		}
	})
}

function resolveVendors(vendorEsbuild) {
	return ({
		name: "resolvevendors",
		setup: (build)=>{
			build.onResolve({filter: /.*/},async ev=>{
				if (ev.pluginData && ev.pluginData.real)
					return;

				if (ev.path.startsWith("real:")) {
					let p=ev.path.replace("real:","");
					//console.log("resolving real: "+p);

					let resolved=await build.resolve(p,{
						kind: ev.kind,
						resolveDir: ev.resolveDir,
						pluginData: {real: true},
					});

					//console.log("****** resolved real: "+p+" as "+resolved.path);

					return resolved;
				}

				if (vendorEsbuild.vendorPackages.includes(ev.path)) {
					//console.log("vendored: "+ev.path+" "+ev.kind);
					return await build.resolve(vendorEsbuild.getVendorPath(ev.path,".jsx"),{
						kind: ev.kind,
						//resolveDir: ev.resolveDir,
						resolveDir: vendorEsbuild.tmpdir,
					});
				}
			});
		}
	})
}

export class VendorEsbuild {
	constructor({preset, ...args}) {
		let isoqPath=path.resolve(__dirname,"../..");
		let preactPath=path.dirname(require.resolve("preact/package.json"));
		let preactRenderToStringPath=path.dirname(require.resolve("preact-render-to-string/package.json"));

		let presets={
			preact: {
				bundle: true,
				format: "esm",
				jsx: 'automatic',
				jsxImportSource: 'preact',
				vendorPackages: ["isoq","preact","preact/compat","preact/jsx-runtime","preact-render-to-string"],
				plugins: [
					esbuildModuleAlias({
						"react": "preact/compat",
						"react-dom": "preact/compat",
						"react/jsx-runtime": "preact/jsx-runtime",
					})
				],
				vendorPlugins: [
					esbuildModuleAlias({
						"isoq/*": isoqPath,
						"preact/*": preactPath,
						"preact-render-to-string": preactRenderToStringPath,
					})
				]
			}
		}

		if (preset)
			args={...presets[preset],...args};

		let {tmpdir, prune, vendor, vendorPackages, 
				vendorPlugins, vendorOptions, vendorExclude, ...options}=args;

		this.vendorExclude=vendorExclude;
		if (!this.vendorExclude)
			this.vendorExclude=[];

		this.defaultVendorPackages=vendorPackages;
		if (!this.defaultVendorPackages)
			this.defaultVendorPackages=[];

		this.vendorPlugins=vendorPlugins;
		if (!this.vendorPlugins)
			this.vendorPlugins=[]

		this.prune=prune;
		this.vendor=vendor;
		this.tmpdir=tmpdir;
		this.options=options;
		this.vendorOptions=vendorOptions;

		if (!this.options.plugins)
			this.options.plugins=[];

		if (this.options.outfile && 
				this.options.outdir &&
				path.dirname(this.options.outfile)!=this.options.outdir)
			throw new Error("If using both outfile and outdir, the outdir must contain the outfile.");

		if (this.vendor) {
			if (!this.tmpdir)
				throw new Error("Vendor build requires tmpdir");

			if (!this.options.outdir)
				throw new Error("Vendor build requires outdir");

			/*if (this.options.outfile)
				throw new Error("Vendor build cannot use outfile");*/

			if (!this.options.chunkNames ||
					!this.options.chunkNames.includes("[hash]"))
				throw new Error("Vendor build requires chunkNames including [hash]");
		}
	}

	async pruneOld(pruneVendor) {
		if (!this.prune)
			return;

		if (!this.options.chunkNames || !this.options.outdir)
			return;

		//console.log("pruning, including vendor="+pruneVendor);

		let fileNames=await fsp.readdir(this.options.outdir);
		let pattern=this.options.chunkNames.replace("[hash]","*")+".js";
		let promises=[];
		for (let fileName of fileNames) {
			if (minimatch(fileName,pattern)) {
				if (fileName.includes("vendor") &&
						!pruneVendor)
					continue;

				//console.log("pruning: "+fileName);
				promises.push(fsp.rm(path.join(this.options.outdir,fileName)));
			}
		}

		await Promise.all(promises);
	}

	getVendorPath(path, ext) {
		let hash="vendor-"+path.replaceAll("/","-").replaceAll(".","-");

		return "./"+this.options.chunkNames.replace("[hash]",hash)+ext;
	}

	async build() {
		await this.pruneOld(true);

		if (!this.vendor) {
			let options={...this.options};
			options.plugins=[...this.options.plugins,...this.vendorPlugins];
			if (options.outfile)
				delete options.outdir;

			await esbuild.build(options);
			return;
		}

		await fsp.mkdir(this.tmpdir,{recursive: true});
		await this.populateVendorCands();
		this.vendorPackages=[...this.defaultVendorPackages];
		await esbuild.build(this.getBuildOptions());
		await this.buildVendor();
	}

	async populateVendorCands() {
		this.vendorCands=[];
		for (let entryPoint of this.options.entryPoints) {
			let pkg=await readPackageUp({cwd: entryPoint});
			if (pkg && pkg.packageJson.dependencies) {
				for (let key of Object.keys(pkg.packageJson.dependencies)) {
					if (!this.vendorCands.includes(key))
						this.vendorCands.push(key);
				}
			}
		}
	}

	getBuildOptions() {
		let buildOptions={...this.options};
		if (buildOptions.outfile)
			delete buildOptions.outdir;

		buildOptions.plugins=[...this.options.plugins,collectVendors(this)];
		return buildOptions;
	}

	async buildVendor() {
		//console.log(this.vendorPackages);

		let entryPoints=[];
		for (let vendorPackage of this.vendorPackages) {
			let content=`import * as mod from "real:${vendorPackage}";\nexport * from "real:${vendorPackage}";\nexport default mod.default;\n`;
			let fn=path.join(this.tmpdir,this.getVendorPath(vendorPackage,".jsx"));
			entryPoints.push(fn);
			await fsp.writeFile(fn,content);
		}

		await esbuild.build({
			plugins: [...this.options.plugins,resolveVendors(this),...this.vendorPlugins],
			entryPoints: entryPoints,
			outdir: this.options.outdir,
			jsx: this.options.jsx,
			jsxImportSource: this.options.jsxImportSource,
			chunkNames: this.options.chunkNames.replace("[hash]","vendor-[hash]"),
			splitting: true,
			bundle: true,
			format: "esm",
			minify: this.options.minify,
			logOverride: {"import-is-undefined": "silent"},
			...this.vendorOptions
		});
	}

	async createContext() {
		if (this.buildContext)
			throw new Error("Context already created");

		if (!this.vendor) {
			let options={...this.options};
			options.plugins=[...this.options.plugins,...this.vendorPlugins];
			if (options.outfile)
				delete options.outdir;

			this.buildContext=await esbuild.context(options);
			return;
		}

		await fsp.mkdir(this.tmpdir,{recursive: true});
		await this.populateVendorCands();
		this.buildContext=await esbuild.context(this.getBuildOptions());
	}

	async rebuild() {
		await this.pruneOld(!this.buildVendorDone);

		this.vendorPackages=[...this.defaultVendorPackages];
		await this.buildContext.rebuild();

		if (this.vendor && this.buildVendorDone) {
			//console.log("Reusing vendor build.");
		}

		if (this.vendor && !this.buildVendorDone) {
			//console.log("Creating vendor build...");
			await this.buildVendor();
			this.buildVendorDone=true;
		}
	}

	async dispose() {
		if (!this.buildContext)
			throw new Error("Can't dispose, no context running...");

		await this.buildContext.dispose();
		this.buildContext=undefined;
	}
}

export async function vendoredBuild(options) {
	let builder=new VendorEsbuild(options);
	await builder.build();
}

export async function vendoredContext(options) {
	let builder=new VendorEsbuild(options);
	await builder.createContext();

	return builder;
}