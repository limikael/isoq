export default function Head({children}) {
	if (typeof window==="undefined")
		global.__headChildren=children;

	return "";
}