import fs from "fs";
import path from "path";
import esbuild from "esbuild";
import {fileURLToPath} from "url";
import BrowserBundler from "./BrowserBundler.js";
import os from "os";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default class Bundler {
	constructor(inFile, conf={}) {
		conf={
			...conf,
			out: path.resolve(conf.out),
			esbuild: esbuild,
			fs: fs,
			tmpdir: os.tmpdir(),
			isoqdir: path.resolve(__dirname,"../..")
		};

		if (conf.contentdir)
			conf.contentdir=path.resolve(conf.contentdir);

		this.browserBundler=new BrowserBundler(path.resolve(inFile),conf);
	}

	/*checkSymLinks() {
		function countSymLinks(fn, cnt) {
			if (fs.existsSync(fn)) {
				if (fs.lstatSync(fn).isSymbolicLink())
					cnt.links++;

				else
					cnt.nonlinks++;
			}
		}

		let linkCount={links: 0, nonlinks: 0};
		countSymLinks("node_modules/isoq",linkCount);
		countSymLinks("node_modules/preact",linkCount);

		if (linkCount.links && linkCount.nonlinks)
			throw new Error("One of isoq or preact is symlinked. They should both be, or none.");
	}*/

	async bundle() {
		//this.checkSymLinks();
		await this.browserBundler.bundle();
	}
}
