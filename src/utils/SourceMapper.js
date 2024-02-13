import * as stackTraceParser from 'stacktrace-parser';
import resolvePath from "@einheit/path-resolve";

export default class SourceMapper {
	constructor() {
	}

	async transformError(error) {
		let sourceMapConsumer=await new this.SourceMapConsumer(this.map);
		let stack=stackTraceParser.parse(error.stack);

		let entryLines=[];
		for (let entry of stack) {
			let original=sourceMapConsumer.originalPositionFor({
				line: entry.lineNumber,
				column: entry.column,
			});

			let sourceUrl=this.resolveSource(original.source);

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

		if (sourceMapConsumer.destroy)
			sourceMapConsumer.destroy();

		return {
			message: String(error),
			stack: String(error)+"\n"+entryLines.join("\n"),
			toString: ()=>error.toString()
		}
	}

	resolveSource(sourceName) {
		let resolvedSource=resolvePath(this.mapDir,sourceName);

		if (resolvedSource.startsWith("/"))
			return "file://"+resolvedSource;

		else
			return "file:///"+resolvedSource;
	}
}
