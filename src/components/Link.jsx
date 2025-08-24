import {useRedirect} from "./router.jsx";

/**
 * A navigation component that behaves like a standard `<a>` element,
 * but intercepts clicks on **local links** (within the same site) to
 * prevent a full page reload.  
 *
 * This allows client-side navigation while still falling back to
 * default browser behavior for external URLs.
 *
 * @component
 *
 * @example
 * // Navigate internally without reloading the page
 * <Link href="/about">About Us</Link>
 *
 * @example
 * // External link behaves like a normal <a>
 * <Link href="https://example.com">External Site</Link>
 *
 * @param {Object} props
 * @param {string} props.href - The URL to navigate to.
 * @param {string} props.to - Alias for href.
 * @param {React.ReactNode} props.children - The link text or elements.
 * @param {Object} [props.props] - Any other props are passed directly to the underlying `<a>`.
 *
 * @returns {JSX.Element} A link element with client-side navigation for local URLs.
 */
export function Link({href, to, ...props}) {
	if (to && !href)
		href=to;

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
