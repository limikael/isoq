import fs from "fs";
import {rmRecursive} from "../src/utils/fs-util.js";

await rmRecursive(fs.promises,"/tmp/hello");
