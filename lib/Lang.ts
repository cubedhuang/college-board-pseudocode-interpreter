import { Interpreter } from "./Interpreter";
import { Lexer } from "./Lexer";
import { Parser } from "./Parser";
import { Renderer } from "./Renderer";

export class Lang {
	hasError = false;
	renderer = new Renderer();
	interpreter!: Interpreter;
	src = "";
	resolveInput!: (
		value: string | boolean,
		type: "string" | "number" | "boolean" | "exit"
	) => void;

	elements = {
		run: document.getElementById("run") as HTMLButtonElement,
		src: document.getElementById("editor") as HTMLTextAreaElement,
		symbols: Array.from(
			document.getElementsByClassName("make-symbol")
		) as HTMLButtonElement[],
		output: document.getElementById("output") as HTMLPreElement,
		ast: document.getElementById("ast") as HTMLDivElement,
		expand: document.getElementById("expand") as HTMLButtonElement,
		collapse: document.getElementById("collapse") as HTMLButtonElement,
		tokens: document.getElementById("tokens") as HTMLPreElement,
		inputs: document.getElementById("inputs") as HTMLDivElement,
		input: document.getElementById("input") as HTMLInputElement,
		inputType: document.getElementById("input-type") as HTMLSelectElement,
		enter: document.getElementById("enter") as HTMLButtonElement,
		exit: document.getElementById("exit") as HTMLButtonElement
	};

	constructor() {
		for (const e of this.elements.symbols) {
			e.addEventListener("click", () => {
				const text = e.textContent ?? "";
				const input = this.elements.src;

				const start = input.selectionStart;
				const end = input.selectionEnd;

				input.value =
					input.value.slice(0, start) + text + input.value.slice(end);

				input.selectionStart = start + text.length;
				input.selectionEnd = start + text.length;
				input.focus();
			});
		}

		this.elements.src.addEventListener("keydown", e => {
			if (e.key === "Tab") {
				e.preventDefault();
				const text = this.elements.src.value;
				const input = this.elements.src;

				const start = input.selectionStart;
				const end = input.selectionEnd;

				input.value =
					text.substring(0, start) + "  " + text.substring(end);

				input.selectionStart = start + 2;
				input.selectionEnd = start + 2;
			} else if (e.key === "Enter" && e.ctrlKey) {
				e.preventDefault();
				this.elements.run.click();
			}
		});

		this.elements.src.addEventListener("change", () => {
			localStorage.setItem("src", this.elements.src.value);
		});

		this.elements.run.addEventListener("click", async () => {
			await this.run(this.elements.src.value);
			this.hasError = false;
		});

		this.elements.src.value = localStorage.getItem("src") || "";

		this.elements.input.addEventListener("keydown", e => {
			if (e.key === "Enter") {
				e.preventDefault();
				this.elements.enter.click();
			}
		});

		this.elements.enter.addEventListener("click", async () => {
			const type = this.elements.inputType.value;
			const input =
				type === "boolean"
					? this.elements.input.checked
					: this.elements.input.value;

			this.resolveInput(input, type as "string" | "number" | "boolean");

			this.elements.input.value = "";
		});

		this.elements.inputType.addEventListener("change", () => {
			this.elements.input.value = "";

			if (this.elements.inputType.value === "string") {
				this.elements.input.type = "text";
			} else if (this.elements.inputType.value === "number") {
				this.elements.input.type = "number";
			} else if (this.elements.inputType.value === "boolean") {
				this.elements.input.type = "checkbox";
			}
		});

		this.elements.exit.addEventListener("click", () => {
			this.resolveInput("", "exit");

			this.elements.input.value = "";
		});

		this.elements.expand.addEventListener("click", () => {
			for (const details of Array.from(
				this.elements.ast.getElementsByTagName("details")
			)) {
				details.open = true;
			}
		});

		this.elements.collapse.addEventListener("click", () => {
			for (const details of Array.from(
				this.elements.ast.getElementsByTagName("details")
			)) {
				details.open = false;
			}
		});
	}

	awaitInput() {
		this.elements.inputs.classList.remove("hidden");
		this.elements.input.focus();

		return new Promise<{
			value: string | boolean;
			type: "string" | "number" | "boolean" | "exit";
		}>(resolve => {
			this.resolveInput = (value, type) => {
				resolve({ value, type });

				this.elements.inputs.classList.add("hidden");
			};
		});
	}

	async run(src: string) {
		this.src = src;

		this.setOutput("");

		const lexer = new Lexer(this, src);
		const tokens = lexer.makeTokens();
		if (!tokens || this.hasError) return;
		if ((this.elements.tokens.parentElement as HTMLDetailsElement).open) {
			this.elements.tokens.textContent = tokens
				.map(t => t.toString())
				.join("\n");
		} else {
			this.elements.tokens.textContent = "...";
		}

		const parser = new Parser(this, tokens);
		const statements = parser.parse();
		if (!statements || this.hasError) return;
		if ((this.elements.ast.parentElement as HTMLDetailsElement).open) {
			this.elements.ast.textContent = "";
			const render = this.renderer.render(statements);
			this.elements.ast.appendChild(render);
		} else {
			this.elements.ast.textContent = "...";
		}

		(this.elements.output.parentElement as HTMLDetailsElement).open = true;

		this.interpreter = new Interpreter(this);
		await this.interpreter.interpret(statements);

		if (this.hasError) return;

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
