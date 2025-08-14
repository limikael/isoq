#!/usr/bin/env node

import {program} from "commander";
import {isoqBundle} from "./isoq-commands.js";

program.name("isoq")
	.description("Minimal isomorphic middleware generator.")
	.option("--out <out>","The output middleware file.")
    .option("--contentdir <contentdir>","Generate content in this directory. Will require your own middleware to serve the content.")
	.option("--tmpdir <tmpdir>","Directory where to store temporary files.")
    .option("--wrappers <wrappers>","Comma separated list of wrappers.")
    .option("--source-root <sourceRoot>","Show error stack traces relative to this dir.")
    .option("--sourcemap","Generate sourcemap and show formatted errors.")
    .option("--no-minify","Don't minify.")
    .option("--purge-old-js","Purge old javascript files from previous builds.")
	.option("--inline-bundle","Inline the bundle in the script tag rather than loading it.")

	.argument("[entrypoint]","Path to entrypoint.")
	.action(async (entrypoint, options)=>{
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
