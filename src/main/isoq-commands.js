import IsoqBundler from "./IsoqBundler.js";
import path from "node:path";
import {fileURLToPath} from "url";
import {createRequire} from "node:module";
import {esbuildModuleAlias} from "../utils/esbuild-util.js";
import {vendoredBuild, vendoredContext} from "../utils/vendored-build.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

export async function isoqBundle(options) {
	let bundler=new IsoqBundler(options);
	await bundler.bundle();
}

export async function isoqContext(options) {
	let bundler=new IsoqBundler(options);
	await bundler.createContext();
	return bundler;
}

export {vendoredBuild, vendoredContext};
