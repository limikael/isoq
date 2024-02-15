import {SourceMapConsumer} from "source-map";
import fs from "fs";
import path from "path";
import url from "url";
import SourceMapper from "./SourceMapper.js";

export default class SourceMapperNode extends SourceMapper {
	constructor(sourceMapFn) {
		super();
		this.SourceMapConsumer=SourceMapConsumer;
		this.map=JSON.parse(fs.readFileSync(sourceMapFn,"utf8"));
		this.mapDir=path.dirname(sourceMapFn);
	}
}
