import path from "path-browserify";

export async function exists(path, {fs}) {
	try {
		let stat=await fs.promises.stat(path);
		//console.log(stat);
		return true;
	} 

	catch (e) {
		if (e.code!="ENOENT")
			throw e;

		return false;
	}
}

export async function mkdirRecursive(dir, {fs}) {	
	let start="";
	if (path.isAbsolute(dir))
		start=path.sep;

	let parts=dir.split(path.sep);
	for (let i=0; i<=parts.length; i++) {
		let p=path.join(start,...parts.slice(0,i));
		if (!(await exists(p,{fs}))) {
			try {
				await fs.promises.mkdir(p);
			}

			catch (e) {
				if (e.code!="EEXIST")
					throw e;
			}
		}
	}
}

export async function rmRecursive(target, {fs}) {
	let stat=await fs.promises.lstat(target);
	if (stat.isDirectory()) {
		for (let child of await fs.promises.readdir(target))
			await rmRecursive(path.join(target,child),{fs});

		await fs.promises.rmdir(target);
	}

	else {
		await fs.promises.unlink(target);
	}
}

export async function findInPath(searchPath, fn, {fs}) {
	if (await exists(path.join(searchPath,fn),{fs}))
		return path.join(searchPath,fn);

	let parent=path.dirname(searchPath);
	if (parent==searchPath)
		throw new Error("Unable to find: "+fn+" in any parent of: "+searchPath);

	return await findInPath(parent,fn,{fs});
}