import {parseCookie, stringifyCookie} from "../utils/js-util.js";
import urlJoin from "url-join";

export default class IsoqClient {
	constructor({props, refs, appPathname}) {
		this.refs=refs;
		this.props=props;
		this.appPathname=appPathname;
		this.req=new Request(window.location);
		this.cookieDispatcher=new EventTarget();
	}

	getIsoRef(id) {
		return this.refs[id];
	}

	markIsoRefStale(id) {
		delete this.refs[id];
	}

	isSsr() {
		return false;
	}

	getUrl() {
		return window.location;
	}

	getAppUrl(pathname) {
		if (!pathname)
			pathname="";

		let u=new URL(urlJoin(this.appPathname,pathname),this.getUrl());

		return u.toString();
	}

	redirect(url) {
		window.location=url;
	}

	fetch=async (url,options={})=>{
		if (url.startsWith("/"))
			url=new URL(this.req.url).origin+url;

		return await fetch(url,options);
	}

	getBarrier(id) {
		return ()=>{};
	}

	unresolveBarrier() {
	}

	getCookie(key) {
		let parsedCookie=parseCookie(window.document.cookie);
		return parsedCookie[key];
	}

	setCookie(key, value, options={}) {
		document.cookie=stringifyCookie(key,value,options);
		this.cookieDispatcher.dispatchEvent(new Event(key));
	}
}