import {isoqBundle} from "../../src/isoq/Bundler.js";
import path from "node:path";
import {fileURLToPath} from 'url';
import fs, {promises as fsp} from "fs";
import {JSDOM} from "jsdom";

const __dirname=path.dirname(fileURLToPath(import.meta.url));

describe("Bundler",()=>{
	it("can bundle",async ()=>{
		let projectDir=path.join(__dirname,"../tmp/project1");

		await fsp.rm(projectDir,{force:true, recursive: true});
		await fsp.mkdir(projectDir,{recursive: true});
		await fsp.writeFile(path.join(projectDir,"index.jsx"),`
			import {useIsoContext} from "isoq";
			export default function({test}) {
				let iso=useIsoContext();
				//console.log("ssr="+iso.isSsr());
				return <div>hello, ssr={String(iso.isSsr())}</div>;
			}
		`);

		await isoqBundle({
			entrypoint: path.join(projectDir,"index.jsx"),
			out: path.join(projectDir,"request-handler.js"),
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
		expect(content).toEqual("<div>hello, ssr=true</div>");

		dom=new JSDOM(responseBody,{runScripts: "dangerously"});
		content=dom.window.document.getElementById("isoq").innerHTML.trim();
		//console.log(content);
		expect(content).toEqual("<div>hello, ssr=false</div>");
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
		expect(content).toEqual(`<div id="outer">the ssr outer: <div id="inner" hello="test">the inner: <div>hello, ssr=true</div></div></div>`);

		dom=new JSDOM(responseBody,{runScripts: "dangerously"});
		content=dom.window.document.getElementById("isoq").innerHTML.trim();
		//console.log(content);
		expect(content).toEqual(`<div id="outer">the browser outer: <div id="inner" hello="test">the inner: <div>hello, ssr=false</div></div></div>`);
	});
});