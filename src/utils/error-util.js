import * as stackTraceParser from 'stacktrace-parser';
import {TraceMap, originalPositionFor} from '@jridgewell/trace-mapping';
import path from "path-browserify";

const fileUrlToPath = url =>
	decodeURIComponent(new URL(url).pathname).replace(/^\/([a-zA-Z]:)/, '$1');

function extractSourceMap(source) {
    let match=source.match(/\/\/# sourceMappingURL=data:application\/json[^,]+base64,([A-Za-z0-9+/=]+)/);
    if (!match)
    	return;

    let mapJson=JSON.parse(atob(match[1]));
    return mapJson;
}

export async function errorCreateStackFrames({stack, fs, sourceRoot, sourcemap}) {
	let thrownFrames=stackTraceParser.parse(stack);
	let fileNames=[...new Set(thrownFrames.map(f=>f.file))];

	let traceMaps={};
	if (sourcemap) {
		for (let fn of fileNames) {
			let fileContent;
			if (fn.startsWith("file://"))
				fileContent=await fs.promises.readFile(fileUrlToPath(fn),"utf8");

			if (fn.startsWith("http://") || fn.startsWith("https://"))
				fileContent=await (await fetch(fn)).text();

			if (fileContent) {
				let sourceMap=extractSourceMap(fileContent);
				if (sourceMap)
					traceMaps[fn]=new TraceMap(sourceMap);
			}
		}
	}

	let frames=[];
	for (let thrown of thrownFrames) {
		let frame={
			thrown: thrown
		}

		if (traceMaps[thrown.file]) {
			frame.orig=originalPositionFor(traceMaps[thrown.file],{
				line: thrown.lineNumber,
				column: thrown.column
			});

			if (frame.orig && frame.orig.source) {
				frame.line=frame.orig.line;
				frame.column=frame.orig.column;
				frame.name=frame.orig.name;
				if (sourceRoot)
					frame.file=path.relative(sourceRoot,frame.orig.source);

				else
					frame.file=frame.orig.source;

				if (frame.orig.source.includes("node_modules") ||
						frame.file.startsWith(".."))
					frame.noisy=true;
			}
		}

		if (!frame.orig || !frame.orig.source) {
			frame.file=frame.thrown.file;
			frame.name=frame.thrown.methodName;
			frame.line=frame.thrown.lineNumber;
			frame.column=frame.thrown.column;
		}

		frames.push(frame);
	}

	return frames;
}