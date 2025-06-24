#!/usr/bin/env node

import Bundler from "../isoq/Bundler.js";
import yargs from "yargs/yargs";
import {hideBin} from "yargs/helpers";
import path from 'path';
import {fileURLToPath} from 'url';
import fs from "fs";
import bundlerDefault from "../isoq/bundler-default.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
let pkg=JSON.parse(fs.readFileSync(path.join(__dirname,"../../package.json")));

let yargsConf=yargs(hideBin(process.argv))
    .version("version","Show version.",pkg.version)
    .positional("entry point",{
        description: "Source file (required).",
    })
    .option("wrappers",{
        description: "Comma separated list of wrappers.",
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
        default: bundlerDefault.minify
    })
    .option("sourcemap",{
        description: "Generate sourcemaps and show proper files and line numbers on errors. Works only in a Node.js env.",
        type: "boolean",
        default: bundlerDefault.sourcemap
    })
    .option("ignore",{
        description: "Comma separated string with modules to ignore.",
    })
    .option("purge-old-js",{
        description: "Remove all .js files from contentdir before building. Beware!",
        type: "boolean",
    })
    .option("out",{
        description: "Output filename.",
        default: bundlerDefault.out
    })
    .options("quiet",{
        description: "Suppress output.",
    })
    .option("expose-exports",{
        description: "Re-export symbols from the main module in the generated bundle, both on server and client. On the server, also export react and renderToString.",
        type: "boolean",
    })
    .option("inline-bundle",{
        description: "Inline the bundle in the script tag rather than loading it.",
        type: "boolean",
    })
    .strictOptions()
    .usage("isoq -- Isomorphic javascript middleware generator.")

let options=yargsConf.parse();

if (options._.length!=1) {
	yargsConf.showHelp();
	process.exit();
}

if (options.wrappers)
    options.wrappers=options.wrappers.split(",");

else
    options.wrappers=[];

let bundler=new Bundler({entrypoint: options._[0], ...options});

await bundler.bundle();
