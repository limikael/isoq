import {minimatch} from "minimatch";
import {render,options} from "preact";
import {test} from "something-using-preact";

render.something=123;
console.log("something on render: "+render.something);
console.log(options);

console.log(minimatch('bar.foo', '*.foo')) // true!
console.log(minimatch('bar.foo', '*.bar')) // false!
console.log(test());