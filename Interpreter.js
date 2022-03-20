// @ts-check

import {
	ASTNode,
	ExprAssign,
	ExprBinary,
	ExprCall,
	ExprGetIndex,
	ExprList,
	ExprLiteral,
	ExprLogical,
	ExprSetIndex,
	ExprUnary,
	ExprVariable,
	StmtExpr,
	StmtForEach,
	StmtIf,
	StmtProcedure,
	StmtRepeatTimes,
	StmtRepeatUntil,
	StmtReturn
} from "./ast.js";
import { Lang } from "./script.js";
import { TokenType } from "./Token.js";
import {
	LangCallable,
	LangList,
	LangNative,
	LangProcedure,
	Return
} from "./types.js";

/**
 * @typedef {import("./types").InternalValue} InternalValue
 */

export class Env {
	/**
	 * @type {Map<string, InternalValue>}
	 */
	values = new Map();

	/**
	 * @param {Env | null} parent
	 */
	constructor(parent = null) {
		this.parent = parent;
	}

	/**
	 * @param {string} name
	 * @returns {boolean}
	 */
	has(name) {
		return this.values.has(name) || this.parent?.has(name);
	}

	/**
	 * @param {string} name
	 * @returns {InternalValue}
	 */
	get(name) {
		if (this.values.has(name)) {
			return this.values.get(name);
		}

		if (this.parent) {
			return this.parent.get(name);
		}

		throw new Error(`Undefined variable '${name}'.`);
	}

	/**
	 * @param {string} name
	 * @param {InternalValue} value
	 */
	set(name, value) {
		if (this.parent?.has(name)) {
			this.parent.set(name, value);
		} else {
			this.values.set(name, value);
		}
	}

	/**
	 * @param {string} name
	 * @param {InternalValue} value
	 */
	define(name, value) {
		this.values.set(name, value);
	}
}

export class Interpreter {
	env = new Env();
	inProcedure = false;

	constructor() {
		this.env.define(
			"DISPLAY",
			new LangNative("DISPLAY", 1, value => {
				Lang.elements.output.textContent += `${value} `;
				return value;
			})
		);

		this.env.define(
			"RANDOM",
			new LangNative("RANDOM", 2, (a, b) => {
				if (typeof a !== "number") {
					throw new Error("RANDOM: First argument must be a number.");
				}

				if (typeof b !== "number") {
					throw new Error(
						"RANDOM: Second argument must be a number."
					);
				}

				return Math.floor(Math.random() * (b - a + 1)) + a;
			})
		);

		this.env.define(
			"INSERT",
			new LangNative("INSERT", 3, (list, index, value) => {
				if (!(list instanceof LangList)) {
					throw new Error("INSERT: First argument must be a list.");
				}
				if (typeof index !== "number") {
					throw new Error(
						"INSERT: Second argument must be a number."
					);
				}

				list.insert(index, value);

				return list;
			})
		);

		this.env.define(
			"APPEND",
			new LangNative("APPEND", 2, (list, value) => {
				if (!(list instanceof LangList)) {
					throw new Error("APPEND: First argument must be a list.");
				}

				list.append(value);

				return list;
			})
		);

		this.env.define(
			"REMOVE",
			new LangNative("REMOVE", 2, (list, index) => {
				if (!(list instanceof LangList)) {
					throw new Error("REMOVE: First argument must be a list.");
				}
				if (typeof index !== "number") {
					throw new Error(
						"REMOVE: Second argument must be a number."
					);
				}

				list.remove(index);

				return list;
			})
		);

		this.env.define(
			"LENGTH",
			new LangNative("LENGTH", 1, list => {
				if (!(list instanceof LangList)) {
					throw new Error("LENGTH: First argument must be a list.");
				}

				return list.length;
			})
		);
	}

	/**
	 * @param {ASTNode[]} statements
	 */
	async interpret(statements) {
		for (const statement of statements) {
			await this.visit(statement);
		}
	}

	/**
	 * @param {ASTNode} node
	 * @returns {Promise<InternalValue>}
	 */
	async visit(node) {
		if (!(`visit${node.type}` in this)) {
			throw new Error(`No visit${node.type} method.`);
		}

		return await this[`visit${node.type}`].call(this, node);
	}

	/**
	 * @param {ExprLiteral} node
	 */
	async visitExprLiteral(node) {
		return node.value;
	}

	/**
	 * @param {ExprBinary} node
	 */
	async visitExprBinary(node) {
		const left = await this.visit(node.left);
		const right = await this.visit(node.right);

		switch (node.op.type) {
			case TokenType.PLUS:
				// @ts-expect-error
				return left + right;
			case TokenType.MINUS:
				// @ts-expect-error
				return left - right;
			case TokenType.STAR:
				// @ts-expect-error
				return left * right;
			case TokenType.SLASH:
				// @ts-expect-error
				return left / right;
			case TokenType.MOD:
				// @ts-expect-error
				return left % right;
			case TokenType.GT:
				return left > right;
			case TokenType.GE:
				return left >= right;
			case TokenType.LT:
				return left < right;
			case TokenType.LE:
				return left <= right;
			case TokenType.NEQ:
				return left !== right;
			case TokenType.EQ:
				return left === right;
			default:
				throw new Error(`Unknown operator '${node.op.lexeme}'.`);
		}
	}

	/**
	 * @param {ExprLogical} node
	 */
	async visitExprLogical(node) {
		const left = await this.visit(node.left);

		if (node.op.type === TokenType.OR) {
			return left || (await this.visit(node.right));
		} else {
			return left && (await this.visit(node.right));
		}
	}

	/**
	 * @param {ExprUnary} node
	 */
	async visitExprUnary(node) {
		const right = await this.visit(node.right);

		switch (node.op.type) {
			case TokenType.MINUS:
				return -right;
			case TokenType.NOT:
				return !right;
			default:
				throw new Error(`Unknown operator '${node.op.lexeme}'.`);
		}
	}

	/**
	 * @param {ExprVariable} node
	 */
	async visitExprVariable(node) {
		return this.env.get(node.name.lexeme);
	}

	/**
	 * @param {ExprAssign} node
	 */
	async visitExprAssign(node) {
		let value = await this.visit(node.value);
		if (value instanceof LangList) {
			value = value.copy();
		}
		this.env.set(node.name.lexeme, value);
		return value;
	}

	/**
	 * @param {ExprCall} node
	 */
	async visitExprCall(node) {
		const callee = await this.visit(node.callee);

		if (!(callee instanceof LangCallable)) {
			throw new Error(`'${callee}' is not a procedure.`);
		}

		if (node.args.length !== callee.arity) {
			throw new Error(
				`'${callee.name}': Expected ${callee.arity} arguments but got ${node.args.length}.`
			);
		}

		const args = [];

		for (const arg of node.args) {
			args.push(await this.visit(arg));
		}

		const prev = this.inProcedure;
		this.inProcedure = true;
		const result = await callee.call(this, args);
		this.inProcedure = prev;

		return result;
	}

	/**
	 * @param {ExprList} node
	 */
	async visitExprList(node) {
		const values = [];

		for (const expr of node.elements) {
			values.push(await this.visit(expr));
		}

		return new LangList(values);
	}

	/**
	 * @param {ExprGetIndex} node
	 */
	async visitExprGetIndex(node) {
		const list = await this.visit(node.list);
		const index = await this.visit(node.index);

		if (!(list instanceof LangList)) {
			throw new Error(`'${list}' is not a list.`);
		}

		if (typeof index !== "number") {
			throw new Error(`'${index}' is not a number.`);
		}

		return list.get(index);
	}

	/**
	 * @param {ExprSetIndex} node
	 */
	async visitExprSetIndex(node) {
		const list = await this.visit(node.list);
		const index = await this.visit(node.index);

		if (!(list instanceof LangList)) {
			throw new Error(`'${list}' is not a list.`);
		}

		if (typeof index !== "number") {
			throw new Error(`'${index}' is not a number.`);
		}

		const value = await this.visit(node.value);
		list.set(index, value);
		return value;
	}

	/**
	 * @param {StmtExpr} node
	 */
	async visitStmtExpr(node) {
		await this.visit(node.expr);
	}

	/**
	 * @param {StmtProcedure} node
	 */
	async visitStmtProcedure(node) {
		const procedure = new LangProcedure(node.name.lexeme, node);
		this.env.define(node.name.lexeme, procedure);
	}

	/**
	 * @param {StmtIf} node
	 */
	async visitStmtIf(node) {
		if (await this.visit(node.condition)) {
			await this.visitBlock(node.thenBody, new Env(this.env));
		} else if (node.elseBody) {
			await this.visitBlock(node.elseBody, new Env(this.env));
		}
	}

	/**
	 * @param {StmtRepeatTimes} node
	 */
	async visitStmtRepeatTimes(node) {
		const times = await this.visit(node.times);

		for (let i = 0; i < times; i++) {
			await this.visitBlock(node.body, new Env(this.env));
		}
	}

	/**
	 * @param {StmtForEach} node
	 */
	async visitStmtForEach(node) {
		const list = await this.visit(node.list);

		if (!(list instanceof LangList)) {
			throw new Error(`'${list}' is not a list.`);
		}

		for (const value of list.values) {
			const env = new Env(this.env);
			env.define(node.name.lexeme, value);
			await this.visitBlock(node.body, env);
		}
	}

	/**
	 * @param {StmtRepeatUntil} node
	 */
	async visitStmtRepeatUntil(node) {
		while (!(await this.visit(node.condition))) {
			await this.visitBlock(node.body, new Env(this.env));
		}
	}

	/**
	 * @param {StmtReturn} node
	 */
	async visitStmtReturn(node) {
		if (!this.inProcedure) {
			throw new Error("Cannot return outside of a procedure.");
		}
		const value = node.value ? await this.visit(node.value) : undefined;
		throw new Return(value);
	}

	/**
	 * @param {ASTNode[]} nodes
	 * @param {Env} env
	 */
	async visitBlock(nodes, env) {
		const previous = this.env;

		try {
			this.env = env;

			for (const node of nodes) {
				await this.visit(node);
			}
		} finally {
			this.env = previous;
		}
	}
}
