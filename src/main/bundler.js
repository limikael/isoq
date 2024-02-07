import Bundler from "../isoq/Bundler.js";

export default async function bundler(options) {
	if (options.mw && options.mw!="raw")
		throw new Error("mw is obsolete, only raw supported...");

	let bundler=new Bundler({
		...{
			outdir: "node_modules/__ISOQ_MIDDLEWARE",
			minify: true,
		},
		browser: options.entryPoint,
		...options
	});

	await bundler.bundle();
}