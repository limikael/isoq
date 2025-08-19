import {vendoredBuild, vendoredContext} from "../../src/utils/vendored-build.js";
import path from "node:path";
import {fileURLToPath} from 'url';
import fs, {promises as fsp} from "fs";

const __dirname=path.dirname(fileURLToPath(import.meta.url));

describe("vendored build",()=>{
	it("can build",async ()=>{
		let projectDir=path.join(__dirname,"../tmp/project-vendor1");

		await fsp.rm(projectDir,{force:true, recursive: true});
		await fsp.mkdir(projectDir,{recursive: true});
		await fsp.writeFile(path.join(projectDir,"hello.js"),`
			import {minimatch} from "minimatch";

			export function match(name,pattern) {
				return minimatch(name,pattern);
			}
		`);

		await vendoredBuild({
			entryPoints: [path.join(projectDir,"hello.js")],
			outfile: path.join(projectDir,"hello-out.js"),
			bundle: true,
			format: "esm"
		});

		let mod=await import(path.join(projectDir,"hello-out.js"));
		expect(mod.match('bar.foo', '*.foo')).toEqual(true); // true!
		expect(mod.match('bar.foo', '*.bar')).toEqual(false); // false!
	});

	it("can vendor build",async ()=>{
		let projectDir=path.join(__dirname,"../tmp/project-vendor2");

		await fsp.rm(projectDir,{force:true, recursive: true});
		await fsp.mkdir(projectDir,{recursive: true});
		await fsp.writeFile(path.join(projectDir,"hello.js"),`
			import {minimatch} from "minimatch";
			import preact from "preact";
			import React from "preact/compat";

			export function match(name,pattern) {
				return minimatch(name,pattern);
			}
		`);

		await expectAsync(vendoredBuild({
			entryPoints: [path.join(projectDir,"hello.js")],
			outfile: path.join(projectDir,"hello-out.js"),
			bundle: true,
			format: "esm",
			vendor: true
		})).toBeRejectedWith(new Error("Vendor build requires tmpdir"));

		await expectAsync(vendoredBuild({
			entryPoints: [path.join(projectDir,"hello.js")],
			outfile: path.join(projectDir,"hello-out.js"),
			bundle: true,
			format: "esm",
			vendor: true
		})).toBeRejectedWith(new Error("Vendor build requires tmpdir"));

		await vendoredBuild({
			entryPoints: [path.join(projectDir,"hello.js")],
			outdir: path.join(projectDir,"target"),
			bundle: true,
			format: "esm",
			vendor: true,
			tmpdir: path.join(projectDir,"tmp"),
			chunkNames: "hello.[hash]"
		});

		let mod=await import(path.join(projectDir,"target/hello.js"));
		expect(mod.match('bar.foo', '*.foo')).toEqual(true);
		expect(mod.match('bar.foo', '*.bar')).toEqual(false);
	});

	it("can create a context",async()=>{
		let projectDir=path.join(__dirname,"../tmp/project-vendor3");

		await fsp.rm(projectDir,{force:true, recursive: true});
		await fsp.mkdir(projectDir,{recursive: true});
		await fsp.writeFile(path.join(projectDir,"hello.js"),`
			import {minimatch} from "minimatch";
			import {render} from "preact";
			import React from "preact/compat";

			export function match(name,pattern) {
				return minimatch(name,pattern);
			}
		`);

		let context=await vendoredContext({
			entryPoints: [path.join(projectDir,"hello.js")],
			outdir: path.join(projectDir,"target"),
			bundle: true,
			format: "esm",
			vendor: true,
			tmpdir: path.join(projectDir,"tmp"),
			chunkNames: "hello.[hash]"
		});

		await context.rebuild();

		let mod=await import(path.join(projectDir,"target/hello.js"));
		expect(mod.match('bar.foo', '*.foo')).toEqual(true);
		expect(mod.match('bar.foo', '*.bar')).toEqual(false);
	});
});