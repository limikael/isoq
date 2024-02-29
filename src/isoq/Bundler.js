import fs from "fs";
import path from "path";
import esbuild from "esbuild";
import {fileURLToPath} from "url";
import {moduleAlias} from "../utils/esbuild-util.js";
import bundlerDefault from "../isoq/bundler-default.js";
import os from "os";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function buf2hex(buffer) { // buffer is an ArrayBuffer
  return [...new Uint8Array(buffer)]
      .map(x => x.toString(16).padStart(2, '0'))
      .join('');
}

export default class Bundler {
	constructor(inFile, conf={}) {
		this.inFile=inFile;
		Object.assign(this,{...bundlerDefault,...conf});

		if (this.wm || this.outdir)
			throw new Error("mw and outdir is obsolete...");
	}

	countSymLinks(fn,cnt) {
		if (fs.existsSync(fn)) {
			if (fs.lstatSync(fn).isSymbolicLink())
				cnt.links++;

			else
				cnt.nonlinks++;
		}
	}

	async bundle() {
		let resolvedInFile=path.resolve(this.inFile);
		let ab=new TextEncoder("utf-8").encode(resolvedInFile);
		let inHash=buf2hex(await crypto.subtle.digest("SHA-1",ab));
		let outdir=path.join(os.tmpdir(),"isoq-"+inHash);

		let linkCount={links: 0, nonlinks: 0};
		this.countSymLinks("node_modules/isoq",linkCount);
		this.countSymLinks("node_modules/preact",linkCount);

		if (linkCount.links && linkCount.nonlinks)
			throw new Error("One of isoq or preact is symlinked. They should both be, or none.");

		if (fs.existsSync(outdir))
			fs.rmSync(outdir,{recursive: true});

		fs.mkdirSync(outdir,{recursive: true});

		if (this.contentdir) {
			fs.mkdirSync(this.contentdir,{recursive: true});
			if (this.purgeOldJs) {
				this.log("Removing .js files in "+this.contentdir);
				for (let file of await fs.readdirSync(this.contentdir)) {
					if (file.endsWith(".js"))
						await fs.unlinkSync(path.join(this.contentdir,file));
				}
			}
		}

		let commonBuildOptions={
			jsxFactory: "h",
			jsxFragment: "Fragment",
			inject: [path.join(__dirname,"../utils/preact-shim.js")],
			format: "esm",
		};

		if (this.splitting && !this.contentdir)
			throw new Error("Code splitting requires contentdir.");

		this.log("Bundling client...");
		await esbuild.build({
			...commonBuildOptions,
			entryPoints: [path.join(__dirname,"./client.jsx")],
			outdir: this.contentdir?this.contentdir:outdir,
			bundle: true,
			splitting: this.splitting,
			minify: this.minify,
			sourcemap: this.sourcemap,
			plugins: [
				moduleAlias({
					"@browser": path.resolve(this.inFile),
					"react": "preact/compat",
					"react-dom": "preact/compat",
					"react/jsx-runtime": "preact/jsx-runtime"
				})
			],
		});

		let source=null;
		let sourceMapSource=null;
		if (!this.contentdir) {
			source=fs.readFileSync(path.join(outdir,"client.js"),"utf8");

			if (this.sourcemap)
				sourceMapSource=fs.readFileSync(path.join(outdir,"client.js.map"),"utf8");
		}

		fs.writeFileSync(
			path.join(outdir,"client.src.js"),
			`export default ${JSON.stringify(source)};`
		);

		fs.writeFileSync(
			path.join(outdir,"client.src.map.js"),
			`export default ${JSON.stringify(sourceMapSource)};`
		);

		this.log("Bundling request handler...");
		/*fs.writeFileSync(path.join(this.outdir,"package.json"),JSON.stringify({
			name: "__ISOQ_MIDDLEWARE",
			type: "module",
			main: "isoq-request-handler.js"
		}));*/

		let runtimeOptions={
			sourcemap: this.sourcemap,
			sourcemapRoot: path.resolve("node_modules/__ISOQ_MIDDLEWARE")
		};

		fs.writeFileSync(
			path.join(outdir,"global-options.js"),
			`globalThis.__ISOQ_OPTIONS=${JSON.stringify(runtimeOptions)}`
		);

			//"isoq/source-mapper-node": path.resolve(__dirname,"../utils/null.js")

		let handlerExternal=["source-map","fs","path","url"];
		let handlerAlias={
			"@browser": path.resolve(this.inFile),
			"@clientSource": path.resolve(path.join(outdir,"client.src.js")),
			"@clientSourceMap": path.resolve(path.join(outdir,"client.src.map.js")),
			"react": "preact/compat",
			"react-dom": "preact/compat",
			"react/jsx-runtime": "preact/jsx-runtime",
		};

		if (!this.sourcemap) {
			handlerExternal=[];
			handlerAlias["isoq/source-mapper-node"]=path.resolve(__dirname,"../utils/null.js")
		}

		await esbuild.build({
			...commonBuildOptions,
			entryPoints: [path.join(__dirname,"isoq-request-handler.js")],
			inject: [...commonBuildOptions.inject,path.join(outdir,"global-options.js")],
			outfile: this.out,
			bundle: true,
			minify: this.minify,
			sourcemap: this.sourcemap,
			external: handlerExternal,
			plugins: [
				moduleAlias(handlerAlias)
			],
		});

		this.log("Middleware "+
			(this.sourcemap?"with sourcemap":"without sourcemap")+
			" generated in: "+this.out
		);

		if (this.contentdir)
			this.log("Client javascript assets in: "+this.contentdir);

		else
			this.log("The middleware includes javascript assets.")
	}

	log(...args) {
		if (!this.quiet)
			console.log(...args);
	}
}
