import fs from "fs/promises";
import { marked } from "marked";
import Head from "next/head";
import Image from "next/image";
import { useEffect } from "react";

import { Lang } from "../lib/Lang";

interface AboutProps {
	html: string;
}

export async function getStaticProps() {
	const markdown = await fs.readFile("./README.md", "utf8");
	const html = marked(markdown);

	return { props: { html } };
}

export default function Home({ html }: AboutProps) {
	useEffect(() => {
		// @ts-expect-error
		window.lang = new Lang();

		for (const details of Array.from(
			document.getElementsByTagName("details")
		)) {
			details.open = true;
		}
	}, []);

	return (
		<div className="container">
			<Head>
				<title>College Board Pseudocode Interpreter</title>

				<meta name="author" content="Daniel Huang" />
				<meta
					name="description"
					content="An interpreter for College Board's specified pseudocode for the AP CSP Exam."
				/>
				<meta
					name="keywords"
					content="college board, pseudocode, interpreter, parser, computer science, computer science principles, computer science project, language, programming language"
				/>
				<meta name="theme-color" content="#08204b" />

				<meta
					property="og:title"
					content="College Board Pseudocode Interpreter"
				/>
				<meta
					property="og:site_name"
					content="College Board Pseudocode Interpreter"
				/>
				<meta
					property="og:description"
					content="An interpreter for College Board's specified pseudocode for the AP CSP Exam."
				/>
				<meta property="og:url" content="https://board.dan.onl/" />
				<meta property="og:image" content="/slate.png" />
				<meta property="og:image:alt" content="Slate Logo" />

				<link rel="icon" href="/favicon.ico" />
			</Head>

			<h1>College Board Pseudocode Interpreter</h1>

			<div className="editor">
				<h2>
					<label htmlFor="editor">Editor</label>
				</h2>

				<div className="symbols">
					<button className="make-symbol">←</button>
					<button className="make-symbol">≠</button>
					<button className="make-symbol">≤</button>
					<button className="make-symbol">≥</button>
				</div>

				<textarea
					name="editor"
					id="editor"
					cols={30}
					rows={15}
					spellCheck="false"
					data-gramm="false"
					data-gramm_editor="false"
					data-enable-grammarly="false"
				></textarea>
			</div>

			<div className="right">
				<button id="run">run</button>
			</div>

			<details>
				<summary>
					<h3>Output</h3>
				</summary>
				<pre id="output">...</pre>

				<div className="inputs hidden" id="inputs">
					<input type="text" name="input" id="input" />

					<select name="input-type" id="input-type">
						<option value="string" selected={true}>
							string
						</option>
						<option value="number">number</option>
						<option value="boolean">boolean</option>
					</select>

					<button id="enter">enter</button>
					<button id="exit">exit program</button>
				</div>
			</details>

			<details>
				<summary>
					<h3>Syntax Tree</h3>
				</summary>
				<pre id="ast">...</pre>
			</details>

			<details>
				<summary>
					<h3>Tokens</h3>
				</summary>
				<pre id="tokens">...</pre>
			</details>

			<section className="about">
				<h1>
					<span>About</span>
					<a
						className="small"
						href="https://github.com/cubedhuang/college-board-pseudocode-interpreter"
						target="_blank"
						rel="noopener noreferrer"
					>
						<Image
							src="/github.png"
							alt="GitHub"
							width={32}
							height={32}
						/>
					</a>
				</h1>
				<div
					className="about"
					dangerouslySetInnerHTML={{ __html: html }}
				/>
			</section>
		</div>
	);
}
