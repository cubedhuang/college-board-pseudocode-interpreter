// @ts-check

import { Interpreter } from "./Interpreter.js";
import { Lexer } from "./Lexer.js";
import { Parser } from "./Parser.js";
import { Renderer } from "./Renderer.js";

export class Lang {
	static hasError = false;

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
			await this.run(this.elements.input.value);
			this.hasError = false;
		});

		this.elements.input.value = localStorage.getItem("src") || "";
	}

	/**
	 * @param {string} src
	 */
	static async run(src) {
		this.src = src;

		this.setOutput("");

		const lexer = new Lexer(src);
		const tokens = lexer.makeTokens();
		if (!tokens || this.hasError) return;
		this.elements.tokens.textContent = tokens
			.map(t => t.toString())
			.join("\n");

		const parser = new Parser(tokens);
		const statements = parser.parse();
		if (!statements || this.hasError) return;
		this.elements.ast.textContent = this.renderer.render(statements);

		const interpreter = new Interpreter();
		await interpreter.interpret(statements);

		if (this.hasError) return;

		this.setOutput(interpreter.output);
		if (this.output()) this.addOutput("\n");
		this.addOutput("-------\nSUCCESS");
	}

	/**
	 * @param {number} line
	 * @param {number} col
	 * @param {string} message
	 */
	static error(line, col, message) {
		this.hasError = true;

		if (this.output()) this.addOutput("\n");

		this.addOutput(`[${line}:${col}] ${message}\n`);

		const l = this.src.split("\n", line)[line - 1];
		this.addOutput(`${l}\n${" ".repeat(col - 1)}^ here`);
	}

	static output() {
		return this.elements.output.textContent;
	}

	/**
	 * @param {string} output
	 */
	static setOutput(output) {
		this.elements.output.textContent = output;
	}

	/**
	 * @param {string} output
	 */
	static addOutput(output) {
		this.elements.output.textContent += `${output}`;
	}
}
