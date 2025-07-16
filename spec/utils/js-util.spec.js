import {urlMatchPath} from "../../src/utils/js-util.js";

describe("js-util",()=>{
	it("can match paths",async ()=>{
		let res;

		res=urlMatchPath("http:/test/hello/world","/hello/*");
		console.log(res);

		res=urlMatchPath("http:/test/hello/","/hello/*");
		console.log(res);

		res=urlMatchPath("http:/test/hello/","/hello/**");
		console.log(res);
	});
});