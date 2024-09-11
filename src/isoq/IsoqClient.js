import {parseCookie, stringifyCookie} from "../utils/js-util.js";
import urlJoin from "url-join";

export default class IsoqClient {
	constructor({props, refs, appPathname, window}) {
		this.window=window;
		this.refs=refs;
		this.props=props;
		this.appPathname=appPathname;
		this.req=new Request(this.window.location);
		this.cookieDispatcher=new EventTarget();
		this.undefRefs=[];
	}

	getIsoRef(id) {
		if (this.hydration && !this.refs.hasOwnProperty(id))
			this.undefRefs.push(id);

		return this.refs[id];
	}

	markIsoRefStale(id) {
		delete this.refs[id];
	}

	isSsr() {
		return false;
	}

	getUrl() {
		return this.window.location;
	}

	getAppUrl(pathname) {
		if (!pathname)
			pathname="";

		let u=new URL(urlJoin(this.appPathname,pathname),this.getUrl());

		return u.toString();
	}

	getWindow() {
		return this.window;
	}

	redirect(url) {
		this.window.location=url;
	}

	fetch=async (url,options={})=>{
		if (url.startsWith("/"))
			url=new URL(this.req.url).origin+url;

		return await this.window.fetch(url,options);
	}

	getBarrier(id) {
		return ()=>{};
	}

	unresolveBarrier() {
	}

	getCookie(key) {
		let parsedCookie=parseCookie(this.window.document.cookie);
		return parsedCookie[key];
	}

	setCookie(key, value, options={}) {
		document.cookie=stringifyCookie(key,value,options);
		this.cookieDispatcher.dispatchEvent(new Event(key));
	}
}