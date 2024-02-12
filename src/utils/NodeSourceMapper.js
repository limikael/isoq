import {SourceMapConsumer} from "source-map";
import fs from "fs";
import * as stackTraceParser from 'stacktrace-parser';
import path from "path";
import url from "url";

export async function applySourceMapToError(error, sourceMapFn) {
	let map=JSON.parse(fs.readFileSync(sourceMapFn,"utf8"));
	let mapDir=path.dirname(sourceMapFn);
	let sourceMapConsumer=await new SourceMapConsumer(map);
	let stack=stackTraceParser.parse(error.stack);

	let entryLines=[];
	for (let entry of stack) {
		let original=sourceMapConsumer.originalPositionFor({
			line: entry.lineNumber,
			column: entry.column,
		});

		let resolvedSource=path.resolve(mapDir,original.source);
		let sourceUrl=url.pathToFileURL(resolvedSource).href;

		if (original.name) {
			entryLines.push(
				"    at "+original.name+" ("+sourceUrl+":"+original.line+":"+original.column+")"
			);
		}

		else {
			entryLines.push(
				"    at "+sourceUrl+":"+original.line+":"+original.column
			);
		}
	}

	sourceMapConsumer.destroy();

	return {
		message: String(error),
		stack: String(error)+"\n"+entryLines.join("\n"),
		toString: ()=>error.toString()
	}
}