import IsoqBundler from "./IsoqBundler.js";

export async function isoqBundle(options) {
	let bundler=new IsoqBundler(options);
	await bundler.bundle();
}