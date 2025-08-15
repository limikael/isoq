import IsoqBundler from "./IsoqBundler.js";
import path from "node:path";
import {fileURLToPath} from "url";
import {createRequire} from "node:module";
import {esbuildModuleAlias} from "../utils/esbuild-util.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

export async function isoqBundle(options) {
	let bundler=new IsoqBundler(options);
	await bundler.bundle();
}

export async function isoqGetEsbuildOptions(conf) {
	return ({
		format: "esm",
		jsx: 'automatic',
		jsxImportSource: 'preact',
		plugins: [
			esbuildModuleAlias({
				"preact": require.resolve("preact"),
				"preact/compat": require.resolve("preact/compat"),
				"preact/jsx-runtime": require.resolve("preact/jsx-runtime"),
				"react": require.resolve("preact/compat"),
				//"react-dom": "preact/compat",
				//"react/jsx-runtime": "preact/jsx-runtime"
			})
		],
		bundle: true
	});
}
