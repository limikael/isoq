import path from "path-browserify";

export async function exists(fsPromises, path) {
	try {
		let stat=await fsPromises.stat(path);
		//console.log(stat);
		return true;
	} 

	catch (e) {
		if (e.code!="ENOENT")
			throw e;

		return false;
	}
}

export async function mkdirRecursive(fsPromises, dir) {	
	let start="";
	if (path.isAbsolute(dir))
		start=path.sep;

	let parts=dir.split(path.sep);
	for (let i=0; i<=parts.length; i++) {
		let p=path.join(start,...parts.slice(0,i));
		if (!(await exists(fsPromises,p))) {
			try {
				await fsPromises.mkdir(p);
			}

			catch (e) {
				if (e.code!="EEXIST")
					throw e;
			}
		}
	}
}

export async function rmRecursive(fsPromises, target) {
	let stat=await fsPromises.lstat(target);
	if (stat.isDirectory()) {
		for (let child of await fsPromises.readdir(target))
			await rmRecursive(fsPromises,path.join(target,child));

		await fsPromises.rmdir(target);
	}

	else {
		await fsPromises.unlink(target);
	}
}