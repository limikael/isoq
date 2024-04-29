import path from "path-browserify";
//import {fileURLToPath} from "url";

//const __dirname = path.dirname(fileURLToPath(import.meta.url));

/*escapeStringRegExp.matchOperatorsRe = /[|\\{}()[\]^$+*?.]/g;
function escapeStringRegExp(str) {
    return str.replace(escapeStringRegExp.matchOperatorsRe, '\\$&');
}*/

/*export function fileContents(filemap) {
	function escapeNamespace(keys) {
		return new RegExp(
	    	`^${keys
				.map((str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
				.join('|')}$`
		);
	}

	const escapedNamespace = escapeNamespace(Object.keys(filemap));

	return {
		name: "filecontents",
		setup: (build)=>{
			console.log("Setting up file contents..");
			let resolveResults={};

			build.onLoad({filter: escapedNamespace, namespace: "isoq"},async (ev)=>{
				if (!filemap[ev.path])
					throw new Error("Can't load: "+ev.path);

				return {
					contents: filemap[ev.path],
				}
			});
		}
	}
}*/

export function moduleAlias(aliases) {
	function escapeNamespace(keys) {
		return new RegExp(
	    	`^${keys
				.map((str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
				.join('|')}$`
		);
	}

	const escapedNamespace = escapeNamespace(Object.keys(aliases));

	return {
		name: "myaliaspath",
		setup: (build)=>{
			let resolveResults={};

			build.onResolve({filter: escapedNamespace},async (ev)=>{
				if (!aliases[ev.path])
					return null;

				if (aliases[ev.path]=="%PASS%") {
					console.log("passing...");
					return {path: ev.path, namespace: "isoq"};
				}

				if (!resolveResults[ev.path]) {
					//console.log("will resolve ",ev);
					let result=await build.resolve(aliases[ev.path],{
						kind: ev.kind,
						resolveDir: ev.resolveDir, //"."
					});

			        if (result.errors.length > 0)
			            return { errors: result.errors }

					resolveResults[ev.path]={path: result.path};
				}

		        return resolveResults[ev.path];
			});
		}
	}
}

export function ignorePaths(paths) {
	if (!paths)
		paths=[];

	function escapeNamespace(keys) {
		return new RegExp(
	    	`^${keys
				.map((str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
				.join('|')}$`
		);
	}

	const escapedNamespace = escapeNamespace(paths);

	return {
		name: "ignorepath",
		setup: (build)=>{
			let resolveResults={};

			build.onResolve({filter: escapedNamespace},async (ev)=>{
				if (!paths.includes(ev.path))
					return;

				return {
					path: "ignore",
					namespace: "ignore"
				}
			});

			build.onLoad({filter: /.*/, namespace: "ignore"}, async args=>{
				return {
					contents: "export default null;"
				};
			})
		}
	}
}
