import {VendorEsbuild} from "../src/utils/vendor-esbuild.js";

let builder=new VendorEsbuild({
	entryPoints: ["lab/matchtest.js"],
	outdir: "lab/target",
	tmpdir: "lab/tmp",
	bundle: true,
	format: "esm"
});

await builder.build();
