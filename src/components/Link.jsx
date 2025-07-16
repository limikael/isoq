import {useIsoContext} from "../isoq/IsoContext.js";

export function Link({href, ...props}) {
	let iso=useIsoContext();
	let Element="a";

	if (href)
		href=iso.getAppUrl(href);

	function onLinkClick(ev) {
		if (props.onClick)
			props.onClick(ev);

		if (props.onclick)
			props.onclick(ev);

		if (ev.defaultPrevented)
			return;

		ev.preventDefault();
		if (href) {
			iso.redirect(href);
			//let targetUrl=String(new URL(props.href,window.location));
			//let targetUrl=iso.getAppUrl(props.href);
			//router.setPendingUrl(href);
		}
	}

	return <Element href={href} {...props} onClick={onLinkClick}>{props.children}</Element>
}
