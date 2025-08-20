import {isoqBundle, isoqContext} from "../../src/main/isoq-commands.js";
import path from "node:path";
import {fileURLToPath} from 'url';
import fs, {promises as fsp} from "fs";
import {JSDOM} from "jsdom";

const __dirname=path.dirname(fileURLToPath(import.meta.url));

describe("isoq",()=>{
	it("can bundle",async ()=>{
		let projectDir=path.join(__dirname,"../tmp/project1");

		await fsp.rm(projectDir,{force:true, recursive: true});
		await fsp.mkdir(projectDir,{recursive: true});
		await fsp.writeFile(path.join(projectDir,"index.jsx"),`
			import {useIsoContext} from "isoq";

			export default function({test}) {
				let iso=useIsoContext();
				return <div>hello: {String(iso.isSsr())}</div>;
			}
		`);

		await isoqBundle({
			entrypoint: path.join(projectDir,"index.jsx"),
			out: path.join(projectDir,"request-handler.js"),
			tmpdir: path.join(projectDir,".target"),
			inlineBundle: true,
			quiet: true
		});

		let result={};
		let handler=(await import(path.join(projectDir,"request-handler.js"))).default;
		let response=await handler(new Request("http://hello.world/"));
		let responseBody=await response.text();
		let dom,content;

		dom=new JSDOM(responseBody,{runScripts: undefined});
		content=dom.window.document.getElementById("isoq").innerHTML.trim();
		expect(content).toEqual(`<div style="display:contents;"><div>hello: true</div></div>`);

		dom=new JSDOM(responseBody,{runScripts: "dangerously"});
		content=dom.window.document.getElementById("isoq").innerHTML.trim();
		expect(content).toEqual(`<div style="display:contents;"><div>hello: false</div></div>`);
	});

	it("can use wrappers",async ()=>{
		let projectDir=path.join(__dirname,"../tmp/project2");

		await fsp.rm(projectDir,{force:true, recursive: true});
		await fsp.mkdir(projectDir,{recursive: true});
		await fsp.writeFile(path.join(projectDir,"index.jsx"),`
			import {useIsoContext} from "isoq";
			export default function() {
				let iso=useIsoContext();
				//console.log("ssr="+iso.isSsr());
				return <div>hello, ssr={String(iso.isSsr())}</div>;
			}
		`);

		await fsp.writeFile(path.join(projectDir,"Wrapper1.jsx"),`
			import {useIsoContext} from "isoq";
			export default function({children}) {
				let iso=useIsoContext();
				return (<div id="outer">the {iso.isSsr()?"ssr":"browser"} outer: {children}</div>)
			}
		`);

		await fsp.writeFile(path.join(projectDir,"Wrapper2.jsx"),`
			export default function({children}) {
				return (<div id="inner" hello="test">the inner: {children}</div>)
			}
		`);

		await isoqBundle({
			entrypoint: path.join(projectDir,"index.jsx"),
			wrappers: [path.join(projectDir,"Wrapper1.jsx"),path.join(projectDir,"Wrapper2.jsx")],
			out: path.join(projectDir,"request-handler.js"),
			tmpdir: path.join(projectDir,".target"),
			inlineBundle: true,
			quiet: true
		});

		let handler=(await import(path.join(projectDir,"request-handler.js"))).default;

		let response=await handler(new Request("http://hello.world/"));
		let responseBody=await response.text();

		let dom,content;

		dom=new JSDOM(responseBody,{runScripts: undefined});
		content=dom.window.document.getElementById("isoq").innerHTML.trim();
		//console.log(content);
		expect(content).toEqual(`<div style="display:contents;"><div id="outer">the ssr outer: <div id="inner" hello="test">the inner: <div>hello, ssr=true</div></div></div></div>`);

		dom=new JSDOM(responseBody,{runScripts: "dangerously"});
		content=dom.window.document.getElementById("isoq").innerHTML.trim();
		//console.log(content);
		expect(content).toEqual(`<div style="display:contents;"><div id="outer">the browser outer: <div id="inner" hello="test">the inner: <div>hello, ssr=false</div></div></div></div>`);
	});

	it("can use a contentdir",async ()=>{
		let projectDir=path.join(__dirname,"../tmp/project-content");

		await fsp.rm(projectDir,{force:true, recursive: true});
		await fsp.mkdir(projectDir,{recursive: true});
		await fsp.writeFile(path.join(projectDir,"index.jsx"),`
			export default function() {
				return <div>hello</div>;
			}
		`);

		await isoqBundle({
			entrypoint: path.join(projectDir,"index.jsx"),
			out: path.join(projectDir,"request-handler.js"),
			tmpdir: path.join(projectDir,".target"),
			contentdir: path.join(projectDir,"public"),
			quiet: true
		});

		let files=await fsp.readdir(path.join(projectDir,"public"));
		expect(files.length).toEqual(2);
	});

	it("can use splitting and purging",async ()=>{
		let projectDir=path.join(__dirname,"../tmp/project-sp");

		await fsp.rm(projectDir,{force:true, recursive: true});
		await fsp.mkdir(projectDir,{recursive: true});
		await fsp.writeFile(path.join(projectDir,"index.jsx"),`
			export default function() {
				return "hello";

				async function f() {
					await import("./component.jsx");
				}
			}
		`);

		await fsp.writeFile(path.join(projectDir,"component.jsx"),`
			export default function() {
				return "hello";
			}
		`);

		await isoqBundle({
			entrypoint: path.join(projectDir,"index.jsx"),
			contentdir: path.join(projectDir,"public"),
			out: path.join(projectDir,"request-handler.js"),
			splitting: true,
			quiet: true
		});

		let files=await fsp.readdir(path.join(projectDir,"public"));
		//console.log(files);
		expect(files.length).toEqual(5);

		await fsp.writeFile(path.join(projectDir,"index.jsx"),`
			export default function() {
				return "hello and changed";

				async function f() {
					await import("./component.jsx");
				}
			}
		`);

		await fsp.writeFile(path.join(projectDir,"component.jsx"),`
			export default function() {
				return "hello changed";
			}
		`);

		await isoqBundle({
			entrypoint: path.join(projectDir,"index.jsx"),
			contentdir: path.join(projectDir,"public"),
			out: path.join(projectDir,"request-handler.js"),
			//purgeOldJs: true,
			splitting: true,
			quiet: true,
		});

		files=await fsp.readdir(path.join(projectDir,"public"));
		expect(files.length).toEqual(7);

		await isoqBundle({
			entrypoint: path.join(projectDir,"index.jsx"),
			contentdir: path.join(projectDir,"public"),
			out: path.join(projectDir,"request-handler.js"),
			purgeOldJs: true,
			splitting: true,
			quiet: true,
		});

		files=await fsp.readdir(path.join(projectDir,"public"));
		//expect(files.length).toEqual(5); // FIXME
		//console.log(files);
	});

	it("can use a context",async ()=>{
		let projectDir=path.join(__dirname,"../tmp/project-context");

		await fsp.rm(projectDir,{force:true, recursive: true});
		await fsp.mkdir(projectDir,{recursive: true});
		await fsp.writeFile(path.join(projectDir,"index.jsx"),`
			import {useIsoContext} from "isoq";

			export default function({test}) {
				let iso=useIsoContext();
				return <div>hello: {String(iso.isSsr())}</div>;
			}
		`);

		let context=await isoqContext({
			entrypoint: path.join(projectDir,"index.jsx"),
			out: path.join(projectDir,"request-handler.js"),
			tmpdir: path.join(projectDir,".target"),
			inlineBundle: true,
			quiet: true
		});

		await context.rebuild();

		let result={};
		let handler=(await import(path.join(projectDir,"request-handler.js"))).default;
		let response=await handler(new Request("http://hello.world/"));
		let responseBody=await response.text();
		let dom,content;

		dom=new JSDOM(responseBody,{runScripts: undefined});
		content=dom.window.document.getElementById("isoq").innerHTML.trim();
		expect(content).toEqual(`<div style="display:contents;"><div>hello: true</div></div>`);

		await fsp.writeFile(path.join(projectDir,"index.jsx"),`
			import {useIsoContext} from "isoq";

			export default function({test}) {
				let iso=useIsoContext();
				return <div>hello2: {String(iso.isSsr())}</div>;
			}
		`);

		await context.rebuild();
		await context.dispose();
	});
});