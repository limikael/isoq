import path from "node:path";

/*export function esbuildFileContents(filemap, {namespace, resolveDir}={}) {
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

			build.onLoad({filter: /.*  fix here!!!  /, namespace: namespace},async (ev)=>{
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
}*/

export function esbuildModuleAlias(aliases) {
	function escapeNamespace(keys) {
		return new RegExp(
	    	`^${keys
				.map((str) => str.replace("/*","").replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
				.join('|')}$`
		);
	}

	const escapedNamespace = escapeNamespace(Object.keys(aliases));

	return {
		name: "modulealias",
		setup: (build)=>{
			let resolveResults={};

			build.onResolve({filter: escapedNamespace},async (ev)=>{
				if (ev.pluginData && ev.pluginData.fromModulealias)
					return;

				if (resolveResults[ev.path])
					return resolveResults[ev.path];

				for (let aliasKey in aliases) {
					let resolved;
					if (ev.path==aliasKey) {
						resolved=await build.resolve(aliases[ev.path],{
							kind: ev.kind,
							resolveDir: ev.resolveDir,
						});
					}

					else if (aliasKey.endsWith("/*") &&
							(ev.path.startsWith(aliasKey.slice(0,-1)) || ev.path==aliasKey.slice(0,-2))) {
						resolved=await build.resolve(ev.path,{
							resolveDir: aliases[aliasKey],
							kind: "import-statement",
							pluginData: {fromModulealias: true}
						});
					}

					if (resolved) {
				        if (resolved.errors.length>0)
				            return {errors: resolved.errors}

				        resolveResults[ev.path]={path: resolved.path};
				        return resolveResults[ev.path];
					}
				}
			});
		}
	}
}

/*export function esbuildModuleAlias(aliases) {
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

				let result=await build.resolve(aliases[ev.path],{
					kind: ev.kind,
					resolveDir: ev.resolveDir, //"."
				});

				console.log(`* resolved ${ev.path} as ${result.path}`);

		        if (result.errors.length > 0)
		            return { errors: result.errors }

				return {path: result.path};
			});
		}
	}
}*/

/*export function esbuildModuleAlias(aliases) {
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
				console.log("hit: "+ev.path);

				if (!aliases[ev.path])
					return null;

				if (!resolveResults[ev.path]) {
					let result=await build.resolve(aliases[ev.path],{
						kind: ev.kind,
						resolveDir: ev.resolveDir, //"."
					});

					console.log(`* resolved ${ev.path} as ${result.path}`);

			        if (result.errors.length > 0)
			            return { errors: result.errors }

					resolveResults[ev.path]={path: result.path};
				}

		        return resolveResults[ev.path];
			});
		}
	}
}*/

/*export function esbuildIgnorePaths(paths) {
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

			build.onLoad({filter: /.*  FIX!! /, namespace: "ignore"}, async args=>{
				return {
					contents: "export default null;"
				};
			})
		}
	}
}*/
