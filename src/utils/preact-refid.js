import {options, Fragment} from "preact";

let currentVNode;
let refIndex;
let includeFnames=false;
//let includeFnames=true;

let oldRender=options.__r;
options.__r=vnode=>{
	currentVNode=vnode;
	refIndex=0;
	if (oldRender)
		oldRender(vnode);
}

function vnodePath(vnode) {
	if (!vnode)
		return "";

    // Skip unkeyed fragments for consistent pathing
    if (vnode.type === Fragment && vnode.key == null) {
        return vnodePath(vnode.__);
    }

	let name=vnode.type;
	//console.log(name);
	if (typeof name=="function") {
		if (includeFnames)
			name=name.name;

		else
			name="C";
	}

	let key=vnode.key;
	if (!key) {
		if (vnode.__i>=0)
			key=vnode.__i;

		else if (vnode.__ && vnode.__.__k)
			key=vnode.__.__k.indexOf(vnode);

		else
			key=0;

		if (key<0)
			console.log("warning: negative key in refid")
	}

	let parentPath=vnodePath(vnode.__);

	return parentPath+(parentPath?"/":"")+name+key;
}

export function useRefId() {
	refIndex++;

	return vnodePath(currentVNode)+"#"+refIndex;
}