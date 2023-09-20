import Bundler from "../isoq/Bundler.js";

export default async function bundler(options) {
	let bundler=new Bundler({
		...{
			outdir: "node_modules/__ISOQ_MIDDLEWARE",
			minify: true,
			mw: "hono"
		},
		browser: options.entryPoint,
		...options
	});

	await bundler.bundle();
}