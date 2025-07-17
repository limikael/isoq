import {useIsoContext} from "../isoq/IsoContext.js";
import {useRedirect} from "./router.jsx";

export function Link({href, ...props}) {
	let redirect=useRedirect();
	let Element="a";

	function onLinkClick(ev) {
		if (props.onClick)
			props.onClick(ev);

		if (props.onclick)
			props.onclick(ev);

		if (ev.defaultPrevented)
			return;

		ev.preventDefault();
		if (href)
			redirect(href);
	}

	return <Element href={href} {...props} onClick={onLinkClick}>{props.children}</Element>
}
