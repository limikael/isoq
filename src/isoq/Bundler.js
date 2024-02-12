import fs from "fs";
import path from "path";
import esbuild from "esbuild";
import {fileURLToPath} from "url";
import {moduleAlias} from "../utils/esbuild-util.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default class Bundler {
	constructor(conf) {
		Object.assign(this,conf);
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
		let linkCount={links: 0, nonlinks: 0};
		this.countSymLinks("node_modules/isoq",linkCount);
		this.countSymLinks("node_modules/preact",linkCount);

		if (linkCount.links && linkCount.nonlinks)
			throw new Error("One of isoq or preact is symlinked. They should both be, or none.");

		if (fs.existsSync(this.outdir))
			fs.rmSync(this.outdir,{recursive: true});

		fs.mkdirSync(this.outdir,{recursive: true});

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
			outdir: this.contentdir?this.contentdir:this.outdir,
			bundle: true,
			splitting: this.splitting,
			minify: this.minify,
			sourcemap: true,
			plugins: [
				moduleAlias({
					"@browser": path.resolve(this.browser),
					"react": "preact/compat",
					"react-dom": "preact/compat",
					"react/jsx-runtime": "preact/jsx-runtime"
				})
			],
		});

		let source=null;
		let sourceMapSource=null;
		if (!this.contentdir) {
			source=fs.readFileSync(path.join(this.outdir,"client.js"),"utf8");
			sourceMapSource=fs.readFileSync(path.join(this.outdir,"client.js.map"),"utf8");
		}

		fs.writeFileSync(
			path.join(this.outdir,"client.src.js"),
			`export default ${JSON.stringify(source)};`
		);

		fs.writeFileSync(
			path.join(this.outdir,"client.src.map.js"),
			`export default ${JSON.stringify(sourceMapSource)};`
		);

		this.log("Bundling request handler...");
		fs.writeFileSync(path.join(this.outdir,"package.json"),JSON.stringify({
			name: "__ISOQ_MIDDLEWARE",
			type: "module",
			main: "isoq-request-handler.js"
		}));

		await esbuild.build({
			...commonBuildOptions,
			entryPoints: [path.join(__dirname,"isoq-request-handler.js")],
			outdir: this.outdir,
			bundle: true,
			minify: this.minify,
			sourcemap: true,
			plugins: [
				moduleAlias({
					"@browser": path.resolve(this.browser),
					"@clientSource": path.resolve(path.join(this.outdir,"client.src.js")),
					"@clientSourceMap": path.resolve(path.join(this.outdir,"client.src.map.js")),
					"react": "preact/compat",
					"react-dom": "preact/compat",
					"react/jsx-runtime": "preact/jsx-runtime"
				})
			],
		});

		this.log("Middleware generated in: "+this.outdir);
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
