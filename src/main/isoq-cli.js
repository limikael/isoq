#!/usr/bin/env node

import Bundler from "../isoq/Bundler.js";
import yargs from "yargs/yargs";
import {hideBin} from "yargs/helpers";

let yargsConf=yargs(hideBin(process.argv))
    .positional("entry point",{
        description: "Source file (required).",
    })
    .option("contentdir",{
        description: "Generate content in this directory. Will require your own middleware to serve the content.",
    })
    .option("splitting",{
        description: "Split code for dynamic client side import. Requires contentdir.",
        type: "boolean"
    })
    .option("minify",{
        description: "Minify client assets.",
        type: "boolean",
        default: true
    })
    .option("mw",{
        description: "Type of middleware to build.",
        choices: ["hono","raw","none"],
        default: "hono"
    })
    .option("purge-old-js",{
        description: "Remove all .js files from contentdir before building. Beware!",
        type: "boolean",
    })
    .option("outdir",{
        description: "Generate middleware in this directory.",
        default: "node_modules/__ISOQ_MIDDLEWARE"
    })
    .options("quiet",{
        description: "Suppress output.",
    })
    .strictOptions()
    .usage("isoq -- Isomorphic javascript middleware generator.")

let options=yargsConf.parse();

if (options._.length!=1) {
	yargsConf.showHelp();
	process.exit();
}

let bundler=new Bundler({
	browser: options._[0],
	...options
});

await bundler.bundle();
