import {useIsoContext} from "./IsoContext.jsx";

/**
 * A React component that inserts its children into the `<head>` of the rendered page.
 * The component can be placed anywhere inside your component tree, and its children 
 * will always be rendered in the document `<head>`. This allows dynamic modification of 
 * the document head from any part of the UI, such as setting titles, meta tags, or links 
 * in a context-aware way.
 *
 * Note: The children should be valid head elements and serializable for SSR if used on the server.
 *
 * @param {Object} props - Component props.
 * @param {React.ReactNode} props.children - Elements to insert inside the document `<head>`.
 *
 * @returns {JSX.Element} A React component that performs a side effect by modifying the document head.
 *
 * @example
 * <Head>
 *   <title>My Page</title>
 *   <meta name="description" content="Example page" />
 * </Head>
 */
export function Head({children}) {
	let isoContext=useIsoContext();

	if (isoContext.isSsr())
		isoContext.headChildren.push(children);

	return <></>
}

export default Head;