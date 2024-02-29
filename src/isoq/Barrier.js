export default class Barrier {
	constructor(id) {
		this.resolved=false;
		this.promise=new Promise(resolve=>{
			this.promiseResolver=resolve
		});

		this.id=id;
		this.resolve.barrierId=id;
	}

	resolve=()=>{
		this.resolved=true;
		this.promiseResolver();
	}

	unresolve() {
		this.resolved=false;
		this.promise=new Promise(resolve=>{
			this.promiseResolver=resolve
		});
	}

	isResolved() {
		return this.resolved;
	}
}
