import { Interpreter } from "./Interpreter";
import { Lexer } from "./Lexer";
import { Parser } from "./Parser";
import { Renderer } from "./Renderer";

export class Lang {
	hasError = false;
	renderer = new Renderer();
	src = "";

	elements = {
		run: document.getElementById("run") as HTMLButtonElement,
		input: document.getElementById("editor") as HTMLTextAreaElement,
		symbols: Array.from(
			document.getElementsByClassName("make-symbol")
		) as HTMLButtonElement[],
		output: document.getElementById("output") as HTMLPreElement,
		ast: document.getElementById("ast") as HTMLPreElement,
		tokens: document.getElementById("tokens") as HTMLPreElement
	};

	constructor() {
		for (const e of this.elements.symbols) {
			e.addEventListener("click", () => {
				const text = e.textContent ?? "";
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
					text.substring(0, start) + "  " + text.substring(end);

				input.selectionStart = start + 2;
				input.selectionEnd = start + 2;
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

	async run(src: string) {
		this.src = src;

		this.setOutput("");

		const lexer = new Lexer(this, src);
		const tokens = lexer.makeTokens();
		if (!tokens || this.hasError) return;
		this.elements.tokens.textContent = tokens
			.map(t => t.toString())
			.join("\n");

		const parser = new Parser(this, tokens);
		const statements = parser.parse();
		if (!statements || this.hasError) return;
		this.elements.ast.textContent = this.renderer.render(statements);

		const interpreter = new Interpreter(this);
		await interpreter.interpret(statements);

		if (this.hasError) return;

		this.setOutput(interpreter.output);
		if (this.output()) this.addOutput("\n");
		this.addOutput("-------\nSUCCESS");
	}

	error(line: number, col: number, message: string) {
		this.hasError = true;

		if (this.output()) this.addOutput("\n");

		this.addOutput(`[${line}:${col}] ${message}\n`);

		const l = this.src.split("\n", line)[line - 1];
		this.addOutput(`${l}\n${" ".repeat(col - 1)}^ here`);
	}

	output() {
		return this.elements.output.textContent;
	}

	setOutput(output: string) {
		this.elements.output.textContent = output;
	}

	addOutput(output: string) {
		this.elements.output.textContent += `${output}`;
	}
}
