import fs from "fs";
import path from "path";
import esbuild from "esbuild";
import {fileURLToPath} from "url";
import {isoqBundle as isoqBundleBrowser} from "./BrowserBundler.js";
import os from "os";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function isoqBundle(conf) {
	conf={
		...conf,
		entrypoint: path.resolve(conf.entrypoint),
		out: path.resolve(conf.out),
		esbuild: esbuild,
		fs: fs,
		tmpdir: os.tmpdir(),
		isoqdir: path.resolve(__dirname,"../..")
	};

	if (conf.contentdir)
		conf.contentdir=path.resolve(conf.contentdir);

	if (!conf.wrappers)
		conf.wrappers=[];

	conf.wrappers=conf.wrappers.map(w=>path.resolve(w));

	await isoqBundleBrowser(conf);
}