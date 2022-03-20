import { marked } from "marked";
import Head from "next/head";
import Image from "next/image";
import { useEffect } from "react";

import { Lang } from "../lib/Lang";

interface AboutProps {
	html: string;
}

export async function getStaticProps() {
	const markdown = await fetch(
		"https://raw.githubusercontent.com/cubedhuang/college-board-pseudocode-interpreter/master/README.md"
	).then(r => r.text());
	const html = marked(markdown);

	return { props: { html } };
}

export default function Home({ html }: AboutProps) {
	if (typeof window === "object") {
		// @ts-expect-error
		window.lang = new Lang();
	}

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

			<h2>
				<label htmlFor="editor">Editor</label>
			</h2>
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

			<div className="spaced">
				<div>
					<h3 className="symbol-header">Special Symbols</h3>
					<div className="symbols">
						<button className="make-symbol">←</button>
						<button className="make-symbol">≠</button>
						<button className="make-symbol">≤</button>
						<button className="make-symbol">≥</button>
					</div>
				</div>

				<button id="run">run</button>
			</div>

			<div>
				<h3>Output</h3>
				<pre id="output"></pre>
			</div>

			<div>
				<h3>Syntax Tree</h3>
				<pre id="ast"></pre>
			</div>

			<div>
				<h3>Tokens</h3>
				<pre id="tokens"></pre>
			</div>

			<section className="about">
				<h1>
					About
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
