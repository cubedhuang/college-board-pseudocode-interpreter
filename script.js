// @ts-check

import { Interpreter } from "./Interpreter.js";
import { Lexer } from "./Lexer.js";
import { Parser } from "./Parser.js";
import { Renderer } from "./Renderer.js";

export class Lang {
	static renderer = new Renderer();

	static elements = {
		run: document.getElementById("run"),
		/**
		 * @type {HTMLInputElement}
		 */
		// @ts-expect-error
		input: document.getElementById("editor"),
		symbols: [...document.getElementsByClassName("make-symbol")],
		output: document.getElementById("output"),
		ast: document.getElementById("ast"),
		tokens: document.getElementById("tokens")
	};

	/**
	 * @param {string} src
	 */
	static async run(src) {
		this.elements.output.textContent = "";

		const lexer = new Lexer(src);
		const tokens = lexer.makeTokens();
		if (!tokens) return;
		this.elements.tokens.textContent = tokens
			.map(t => t.toString())
			.join("\n");

		const parser = new Parser(tokens);
		const statements = parser.parse();
		if (!statements) return;
		this.elements.ast.textContent = this.renderer.render(statements);

		const interpreter = new Interpreter();
		await interpreter.interpret(statements);
	}

	static init() {
		for (const e of this.elements.symbols) {
			e.addEventListener("click", () => {
				const text = e.textContent;
				const input = this.elements.input;

				const start = input.selectionStart;
				const end = input.selectionEnd;

				input.value =
					input.value.slice(0, start) + text + input.value.slice(end);

				input.selectionStart = start + text.length;
				input.selectionEnd = start + text.length;
				input.focus();
			});
		}

		this.elements.input.addEventListener("keydown", e => {
			if (e.key === "Tab") {
				e.preventDefault();
				const text = this.elements.input.value;
				const input = this.elements.input;

				const start = input.selectionStart;
				const end = input.selectionEnd;

				input.value =
					text.substring(0, start) + "\t" + text.substring(end);

				input.selectionStart = this.selectionEnd = start + 1;
				input.selectionEnd = this.selectionEnd = start + 1;
			}
		});

		this.elements.input.addEventListener("change", () => {
			localStorage.setItem("src", this.elements.input.value);
		});

		this.elements.run.addEventListener("click", async () => {
			// @ts-ignore
			await this.run(this.elements.input.value);
		});

		this.elements.input.value = localStorage.getItem("src") || "";
	}
}

Lang.init();

if (typeof globalThis !== "undefined") globalThis.Lang = Lang;
