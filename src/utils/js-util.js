export function jsonEq(a,b) {
	return (JSON.stringify(a)==JSON.stringify(b));
}

export function splitPath(pathname) {
	if (pathname===undefined)
		throw new Error("Undefined pathname");

	return pathname.split("/").filter(s=>s.length>0);
}

export function urlGetArgs(url) {
	return splitPath(new URL(url).pathname);
}

export function urlGetParams(url) {
	let u=new URL(url);
	return Object.fromEntries(u.searchParams);
}

function matchPathArray(path, expr) {
    function helper(pi, ei) {
        var captures = [];

        while (ei < expr.length) {
            var token = expr[ei];

            if (token === "**") {
                // Try matching zero items
                var zero = helper(pi, ei + 1);
                if (zero !== null) return captures.concat(zero);

                // Try matching one or more items
                if (pi < path.length) {
                    var next = helper(pi + 1, ei);
                    if (next !== null) {
                        // Capture current item(s) in "**"
                        var captured = String(path[pi]);
                        return captures.concat([captured], next);
                    }
                }
                return null;
            }

            if (pi >= path.length) return null;

            if (token === "*") {
                captures.push(String(path[pi]));
            } else if (token !== String(path[pi])) {
                return null;
            }

            pi++;
            ei++;
        }

        return pi === path.length ? captures : null;
    }

    return helper(0, 0);
}

export function urlMatchPath(url, path) {
	if (!url)
		return;

	let u=new URL(url);
	let urlSplit=splitPath(u.pathname);
	let pathSplit=splitPath(path);

	return matchPathArray(urlSplit,pathSplit);
}

export function parseCookie(str) {
	if (!str)
		return {};

	return (
	  	str
		    .split(';')
		    .map(v => v.split('='))
		    .reduce((acc, v) => {
		    	if (v.length==2)
					acc[decodeURIComponent(v[0].trim())] = decodeURIComponent(v[1].trim());

				return acc;
		    }, {})
	)
}

export function stringifyCookie(key, value, options={}) {
	let s=encodeURIComponent(key)+"="+encodeURIComponent(value)+";";
	if (options.expires)
		s+="expires="+new Date(options.expires).toUTCString()+";";

	if (options.path)
		s+="path="+options.path+";"

	else
		s+="path=/;"

	return s;
}

export function buf2hex(buffer) { // buffer is an ArrayBuffer
    return [...new Uint8Array(buffer)]
        .map(x => x.toString(16).padStart(2, '0'))
        .join('');
}

export function arrayRemove(array, item) {
	let index=array.indexOf(item);
	if (index>=0)
		array.splice(index,1);

	return array;
}