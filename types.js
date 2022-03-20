// @ts-check

import { StmtProcedure } from "./ast.js";
import { Env, Interpreter } from "./Interpreter.js";

/**
 * @typedef {number | boolean | string | LangNative | LangCallable | LangList} InternalValue
 */

export class Return {
	/**
	 * @param {InternalValue} value
	 */
	constructor(value) {
		this.value = value;
	}
}

export class LangCallable {
	/**
	 * @param {string} name
	 * @param {number} arity
	 */
	constructor(name, arity) {
		this.name = name;
		this.arity = arity;
	}

	/**
	 * @abstract
	 * @param {Interpreter} _interpreter
	 * @param {InternalValue[]} _args
	 * @returns {Promise<InternalValue>}
	 */
	call(_interpreter, _args) {
		throw new Error(`${this.name} does not implement call().`);
	}
}

export class LangNative extends LangCallable {
	/**
	 * @param {string} name
	 * @param {number} arity
	 * @param {(...args: InternalValue[]) => InternalValue | Promise<InternalValue>} fn
	 */
	constructor(name, arity, fn) {
		super(name, arity);
		this.fn = fn;
	}

	/**
	 * @param {Interpreter} _interpreter
	 * @param {InternalValue[]} args
	 * @returns {Promise<InternalValue>}
	 */
	async call(_interpreter, args) {
		return await this.fn(...args);
	}

	toString() {
		return `<native ${this.name}>`;
	}
}

export class LangProcedure extends LangCallable {
	/**
	 * @param {string} name
	 * @param {StmtProcedure} stmt
	 * @param {Env} env
	 */
	constructor(name, stmt, env) {
		super(name, stmt.params.length);
		this.stmt = stmt;
		this.env = env;
	}

	/**
	 * @param {Interpreter} interpreter
	 * @param {InternalValue[]} args
	 * @returns {Promise<InternalValue>}
	 */
	async call(interpreter, args) {
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
	}

	toString() {
		return `<procedure ${this.name}>`;
	}
}

export class LangList {
	/**
	 * @param {InternalValue[]} values
	 */
	constructor(values) {
		this.values = values;
	}

	/**
	 * @param {number} i
	 */
	get(i) {
		this.throwIfOutOfBounds(i);
		return this.values[i - 1];
	}

	/**
	 * @param {number} i
	 * @param {InternalValue} value
	 */
	set(i, value) {
		this.throwIfOutOfBounds(i);
		this.values[i - 1] = value;
	}

	/**
	 * @param {number} i
	 * @param {InternalValue} value
	 */
	insert(i, value) {
		this.throwIfOutOfBounds(i);
		this.values.splice(i - 1, 0, value);
	}

	/**
	 * @param {InternalValue} value
	 */
	append(value) {
		this.values.push(value);
	}

	/**
	 * @param {number} i
	 */
	remove(i) {
		this.throwIfOutOfBounds(i);
		this.values.splice(i - 1, 1);
	}

	/**
	 * @param {number} i
	 */
	outOfBounds(i) {
		return i < 1 || i > this.length;
	}

	/**
	 * @param {number} i
	 */
	throwIfOutOfBounds(i) {
		if (this.outOfBounds(i)) {
			throw new Error(`Index out of bounds: ${i}`);
		}
	}

	copy() {
		return new LangList([...this.values]);
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
