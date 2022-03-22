import type { StmtProcedure } from "./ast";
import { Env, Interpreter } from "./Interpreter";

export type InternalValue =
	| null
	| number
	| boolean
	| string
	| Callable
	| List;

export class Return {
	constructor(public value: InternalValue) {}
}

export abstract class Callable {
	constructor(public name: string, public arity: number) {}

	abstract call(
		_interpreter: Interpreter,
		_args: InternalValue[]
	): Promise<InternalValue>;
}

export class Native extends Callable {
	constructor(
		name: string,
		arity: number,
		public fn: (
			...args: InternalValue[]
		) => InternalValue | Promise<InternalValue>
	) {
		super(name, arity);
	}

	async call(
		_interpreter: Interpreter,
		args: InternalValue[]
	): Promise<InternalValue> {
		return await this.fn(...args);
	}

	toString() {
		return `<native ${this.name}>`;
	}
}

export class LangProcedure extends Callable {
	constructor(name: string, public stmt: StmtProcedure, public env: Env) {
		super(name, stmt.params.length);
	}

	async call(interpreter: Interpreter, args: InternalValue[]) {
		const env = new Env(this.env);

		for (let i = 0; i < args.length; i++) {
			env.define(this.stmt.params[i].lexeme, args[i]);
		}

		try {
			await interpreter.visitBlock(this.stmt.body, env);
		} catch (rtn) {
			if (rtn instanceof Return) {
				return rtn.value;
			}

			throw rtn;
		}

		return null;
	}

	toString() {
		return `<procedure ${this.name}>`;
	}
}

export class List {
	constructor(public values: InternalValue[]) {}

	get(i: number) {
		this.throwIfOutOfBounds(i);
		return this.values[i - 1];
	}

	set(i: number, value: InternalValue) {
		this.throwIfOutOfBounds(i);
		this.values[i - 1] = value;
	}

	insert(i: number, value: InternalValue) {
		this.throwIfOutOfBounds(i);
		this.values.splice(i - 1, 0, value);
	}

	append(value: InternalValue) {
		this.values.push(value);
	}

	remove(i: number) {
		this.throwIfOutOfBounds(i);
		this.values.splice(i - 1, 1);
	}

	outOfBounds(i: number) {
		return i < 1 || i > this.length;
	}

	throwIfOutOfBounds(i: number) {
		if (this.outOfBounds(i)) {
			throw new Error(`Index out of bounds: ${i}`);
		}
	}

	copy() {
		return new List([...this.values]);
	}

	get length() {
		return this.values.length;
	}

	toString() {
		return `[${this.values
			.map(v => (typeof v === "string" ? `"${v}"` : v))
			.join(", ")}]`;
	}
}
