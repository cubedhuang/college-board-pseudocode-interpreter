// @ts-check

import { Lang } from "./Lang.js";

async function main() {
	Lang.init();

	// @ts-expect-error
	window.Lang = Lang;

	// @ts-expect-error
	const marked = window.marked;

	console.log(marked);

	const aboutHtml = await fetch("./README.md").then(res => res.text());
	document.getElementById("about").innerHTML = marked.parse(aboutHtml);

	for (const details of document.getElementsByTagName("details")) {
		details.open = true;
	}
}

main();
