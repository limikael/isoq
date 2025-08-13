//import path from "path-browserify";

export function esbuildFileContents(filemap, {namespace, resolveDir}={}) {
	if (!namespace)
		namespace="filecontent";

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
			//console.log("Setting up file contents..");
			//let resolveResults={};

			build.onLoad({filter: /.*/, namespace: namespace},async (ev)=>{
				//console.log("* fc: "+ev.path);

				if (!filemap[ev.path]) {
					console.log("not found, keys="+JSON.stringify(Object.keys(filemap)));
					throw new Error("Can't load: "+ev.path);
				}

				if (typeof filemap[ev.path]=="string") {
					//console.log("returning ",filemap[ev.path]);
					//console.log(ev);
					return {
						contents: filemap[ev.path],
						resolveDir: resolveDir
					}
				}

				return filemap[ev.path];
			});

			build.onResolve({filter: escapedNamespace},async (ev)=>{
				if (!filemap[ev.path]) {
					//console.log("bad filecontents resolve hit: "+ev.path);
					return;
				}

				//console.log("fc: "+ev.path);

				return {path: ev.path, namespace: namespace}
			});
		}
	}
}

export function esbuildModuleAlias(aliases) {
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

export function esbuildIgnorePaths(paths) {
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
