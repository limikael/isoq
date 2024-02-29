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
    .option("purge-old-js",{
        description: "Remove all .js files from contentdir before building. Beware!",
        type: "boolean",
    })
    /*.option("outdir",{
        description: "Generate middleware in this directory.",
        default: "node_modules/__ISOQ_MIDDLEWARE"
    })*/
    .option("out",{
        description: "Output filename.",
        default: bundlerDefault.out
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

let bundler=new Bundler(options._[0],options);

await bundler.bundle();
