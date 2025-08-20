#!/usr/bin/env node

import {program} from "commander";
import {isoqBundle} from "./isoq-commands.js";
import {getPackageVersion} from "../utils/node-util.js";
import path from "node:path";
import {fileURLToPath} from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

program.name("isoq")
	.description("Minimal isomorphic middleware generator.")
	.option("--version","Print version.")
	.option("--out <out>","The output middleware file.")
    .option("--contentdir <contentdir>","Generate content in this directory. Will require your own middleware to serve the content.")
	.option("--tmpdir <tmpdir>","Directory where to store temporary files.")
    .option("--wrappers <wrappers>","Comma separated list of wrappers.")
    .option("--source-root <sourceRoot>","Show error stack traces relative to this dir.")
    .option("--sourcemap","Generate sourcemap and show formatted errors. Will make the app node work only under node.")
    .option("--no-minify","Don't minify.")
    .option("--no-prune","Don't remove old js chunks.")
	.option("--inline-bundle","Inline the bundle in the script tag rather than loading it.")
	.option("--vendor","Create a separate vendor bundle for external imports.")
	.option("--vendor-exclude <vendorExclude>","Comma separated list of packages to exclude from vendoring.")
	.argument("[entrypoint]","Path to entrypoint.")
	.action(async (entrypoint, options)=>{
		if (options.version) {
			console.log(await getPackageVersion(__dirname));
			return;
		}

		if (!entrypoint) {
			program.help();
			return;
		}

		await isoqBundle({
			entrypoint: entrypoint,
			...options
		});
	});

try {
	await program.parseAsync();
}

catch (e) {
	if (!e.declared)
		throw e;

	console.log("Error: "+e.message);
	process.exit(1);
}
