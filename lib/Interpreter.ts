import type {
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
	StmtForEach,
	StmtIf,
	StmtProcedure,
	StmtRepeatTimes,
	StmtRepeatUntil,
	StmtReturn
} from "./ast";
import type { Lang } from "./Lang";
import { Token, TokenType } from "./Token";
import {
	Callable,
	InternalValue,
	LangProcedure,
	List,
	Native,
	Return
} from "./types";

export class RuntimeError extends Error {
	constructor(public token: Token, message: string) {
		super(`RuntimeError: ${message}`);
	}
}

export class Env {
	values: Map<string, InternalValue> = new Map();

	constructor(public parent: Env | null = null) {}

	has(name: string): boolean {
		return (this.values.has(name) || this.parent?.has(name)) ?? false;
	}

	get(name: Token): InternalValue {
		if (this.values.has(name.lexeme)) {
			return this.values.get(name.lexeme)!;
		}

		if (this.parent) {
			return this.parent.get(name);
		}

		throw new RuntimeError(name, `Undefined variable '${name.lexeme}'.`);
	}

	set(name: string, value: InternalValue) {
		if (this.parent?.has(name)) {
			this.parent.set(name, value);
		} else {
			this.values.set(name, value);
		}
	}

	define(name: string, value: InternalValue) {
		this.values.set(name, value);
	}
}

export class Interpreter {
	env = new Env();
	inProcedure = false;

	constructor(public lang: Lang) {
		this.env.define(
			"DISPLAY",
			new Native("DISPLAY", 1, value => {
				this.lang.addOutput(`${value} `);
				return value;
			})
		);

		this.env.define(
			"RANDOM",
			new Native("RANDOM", 2, (a, b) => {
				if (typeof a !== "number") {
					throw new Error("First argument must be a number.");
				}
				if (typeof b !== "number") {
					throw new Error("Second argument must be a number.");
				}

				return Math.floor(Math.random() * (b - a + 1)) + a;
			})
		);

		this.env.define(
			"INSERT",
			new Native("INSERT", 3, (list, index, value) => {
				if (!(list instanceof List)) {
					throw new Error("First argument must be a list.");
				}
				if (typeof index !== "number") {
					throw new Error("Second argument must be a number.");
				}

				list.insert(index, value);

				return list;
			})
		);

		this.env.define(
			"APPEND",
			new Native("APPEND", 2, (list, value) => {
				if (!(list instanceof List)) {
					throw new Error("First argument must be a list.");
				}

				list.append(value);

				return list;
			})
		);

		this.env.define(
			"REMOVE",
			new Native("REMOVE", 2, (list, index) => {
				if (!(list instanceof List)) {
					throw new Error("First argument must be a list.");
				}
				if (typeof index !== "number") {
					throw new Error("Second argument must be a number.");
				}

				list.remove(index);

				return list;
			})
		);

		this.env.define(
			"LENGTH",
			new Native("LENGTH", 1, list => {
				if (!(list instanceof List) && typeof list !== "string") {
					throw new Error("Argument must be a list or string.");
				}

				return list.length;
			})
		);

		this.env.define(
			"INPUT",
			new Native("INPUT", 0, async () => {
				const input = await this.lang.awaitInput();

				switch (input.type) {
					case "string":
						return input.value;
					case "number":
						return parseInt(input.value as string);
					case "boolean":
						return input.value;
					case "exit":
						throw new Error("User-initiated exit.");
				}
			})
		);
	}

	async interpret(statements: ASTNode[]) {
		try {
			for (const statement of statements) {
				await this.visit(statement);
			}
		} catch (err) {
			if (err instanceof RuntimeError) {
				this.lang.error(err.token.line, err.token.col, err.message);
			} else if (err instanceof Error) {
				this.lang.addOutput(`Unexpected error: ${err.message}`);
			} else {
				throw err;
			}
		}
	}

	async visit(node: ASTNode): Promise<InternalValue> {
		if (!(`visit${node.type}` in this)) {
			throw new Error(`No visit${node.type} method.`);
		}

		// @ts-expect-error
		return await this[`visit${node.type}`].call(this, node);
	}

	async visitExprLiteral(node: ExprLiteral) {
		return node.value;
	}

	async visitExprBinary(node: ExprBinary) {
		const left = await this.visit(node.left);
		const right = await this.visit(node.right);

		switch (node.op.type) {
			case TokenType.NEQ:
				return left !== right;
			case TokenType.EQ:
				return left === right;
		}

		if (
			node.op.type === TokenType.PLUS &&
			(typeof left === "string" || typeof right === "string")
		) {
			return `${left}${right}`;
		}

		if (left instanceof Callable || right instanceof Callable) {
			throw new RuntimeError(
				node.op,
				`Cannot use operator '${node.op.lexeme}' on a procedure.`
			);
		}

		if (typeof left === "boolean" || typeof right === "boolean") {
			throw new RuntimeError(
				node.op,
				`Cannot use operator '${node.op.lexeme}' on a boolean.`
			);
		}

		if (left === null || right === null) {
			throw new RuntimeError(
				node.op,
				`Cannot use operator '${node.op.lexeme}' on null.`
			);
		}

		if (!this.equalTypes(left, right)) {
			throw new RuntimeError(
				node.op,
				`Incompatible operand types for ${typeof left} '${
					node.op.lexeme
				}' ${typeof right}.`
			);
		}

		if (left instanceof List && right instanceof List) {
			switch (node.op.type) {
				case TokenType.GT:
					return left.length > right.length;
				case TokenType.GE:
					return left.length >= right.length;
				case TokenType.LT:
					return left.length < right.length;
				case TokenType.LE:
					return left.length <= right.length;
			}

			throw new RuntimeError(
				node.op,
				`Cannot use operator '${node.op.lexeme}' on lists.`
			);
		}

		if (left instanceof List || right instanceof List) {
			throw new RuntimeError(
				node.op,
				"This code should be unreachable; if this is an error, that is bad."
			);
		}

		switch (node.op.type) {
			case TokenType.GT:
				return left > right;
			case TokenType.GE:
				return left >= right;
			case TokenType.LT:
				return left < right;
			case TokenType.LE:
				return left <= right;
		}

		if (typeof left === "string" || typeof right === "string") {
			throw new RuntimeError(
				node.op,
				`Cannot use operator '${node.op.lexeme}' on strings.`
			);
		}

		switch (node.op.type) {
			case TokenType.PLUS:
				return left + right;
			case TokenType.MINUS:
				return left - right;
			case TokenType.STAR:
				return left * right;
			case TokenType.SLASH:
				return left / right;
			case TokenType.MOD:
				return left % right;
			default:
				throw new RuntimeError(
					node.op,
					`Unknown operator '${node.op.lexeme}'.`
				);
		}
	}

	async visitExprLogical(node: ExprLogical) {
		const left = await this.visit(node.left);

		if (node.op.type === TokenType.OR) {
			return left || (await this.visit(node.right));
		} else {
			return left && (await this.visit(node.right));
		}
	}

	async visitExprUnary(node: ExprUnary) {
		const right = await this.visit(node.right);

		switch (node.op.type) {
			case TokenType.MINUS:
				if (typeof right !== "number") {
					throw new RuntimeError(
						node.op,
						"Operand must be a number."
					);
				}
				return -right;
			case TokenType.NOT:
				return !right;
			default:
				throw new RuntimeError(
					node.op,
					`Unknown operator '${node.op.lexeme}'.`
				);
		}
	}

	async visitExprVariable(node: ExprVariable) {
		return this.env.get(node.name);
	}

	async visitExprAssign(node: ExprAssign) {
		let value = await this.visit(node.value);
		if (value instanceof List) {
			value = value.copy();
		}
		this.env.set(node.name.lexeme, value);
		return value;
	}

	async visitExprCall(node: ExprCall) {
		const callee = await this.visit(node.callee);

		if (!(callee instanceof Callable)) {
			throw new RuntimeError(
				node.paren,
				`'${callee}' must be a procedure.`
			);
		}

		if (node.args.length !== callee.arity) {
			throw new RuntimeError(
				node.paren,
				`'${callee.name}': Expected ${callee.arity} arguments but got ${node.args.length}.`
			);
		}

		const args = [];

		for (const arg of node.args) {
			args.push(await this.visit(arg));
		}

		const prev = this.inProcedure;
		this.inProcedure = true;

		try {
			const result = await callee.call(this, args);
			this.inProcedure = prev;
			return result;
		} catch (err) {
			this.inProcedure = prev;
			if (err instanceof RuntimeError) throw err;
			if (err instanceof Error)
				throw new RuntimeError(node.paren, err.message);
			throw new RuntimeError(node.paren, `${err}`);
		}
	}

	async visitExprList(node: ExprList) {
		const values = [];

		for (const expr of node.elements) {
			values.push(await this.visit(expr));
		}

		return new List(values);
	}

	async visitExprGetIndex(node: ExprGetIndex) {
		const list = await this.visit(node.list);
		const index = await this.visit(node.index);

		if (typeof index !== "number") {
			throw new RuntimeError(node.brack, `'${index}' must be a number.`);
		}

		if (typeof list === "string") {
			if (index < 1 || index > list.length) {
				throw new RuntimeError(
					node.brack,
					`Index out of bounds: ${index}`
				);
			}
			return list[index - 1];
		}

		if (!(list instanceof List)) {
			throw new RuntimeError(
				node.brack,
				`'${list}' must be a list or string.`
			);
		}

		if (list.outOfBounds(index)) {
			throw new RuntimeError(
				node.brack,
				`Index out of bounds: ${index}.`
			);
		}

		return list.get(index);
	}

	async visitExprSetIndex(node: ExprSetIndex) {
		const list = await this.visit(node.list);
		const index = await this.visit(node.index);

		if (typeof index !== "number") {
			throw new RuntimeError(node.brack, `'${index}' must be a number.`);
		}

		if (!(list instanceof List)) {
			throw new RuntimeError(node.brack, `'${list}' must be a list.`);
		}

		if (list.outOfBounds(index)) {
			throw new RuntimeError(
				node.brack,
				`Index out of bounds: ${index}.`
			);
		}

		const value = await this.visit(node.value);
		list.set(index, value);
		return value;
	}

	async visitStmtProcedure(node: StmtProcedure) {
		const procedure = new LangProcedure(node.name.lexeme, node, this.env);
		this.env.define(node.name.lexeme, procedure);
	}

	async visitStmtIf(node: StmtIf) {
		if (await this.visit(node.condition)) {
			await this.visitBlock(node.thenBody, new Env(this.env));
		} else if (node.elseBody) {
			await this.visitBlock(node.elseBody, new Env(this.env));
		}
	}

	async visitStmtRepeatTimes(node: StmtRepeatTimes) {
		const times = await this.visit(node.times);

		if (typeof times !== "number") {
			throw new RuntimeError(node.token, `'${times}' must be a number.`);
		}

		for (let i = 0; i < times; i++) {
			await this.visitBlock(node.body, new Env(this.env));
		}
	}

	async visitStmtForEach(node: StmtForEach) {
		const list = await this.visit(node.list);

		if (!(list instanceof List)) {
			throw new RuntimeError(node.token, `'${list}' must be a list.`);
		}

		for (const value of list.values) {
			const env = new Env(this.env);
			env.define(node.name.lexeme, value);
			await this.visitBlock(node.body, env);
		}
	}

	async visitStmtRepeatUntil(node: StmtRepeatUntil) {
		while (!(await this.visit(node.condition))) {
			await this.visitBlock(node.body, new Env(this.env));
		}
	}

	async visitStmtReturn(node: StmtReturn) {
		if (!this.inProcedure) {
			throw new RuntimeError(
				node.token,
				"Cannot return outside of a procedure."
			);
		}
		const value = node.value ? await this.visit(node.value) : null;
		throw new Return(value);
	}

	async visitBlock(nodes: ASTNode[], env: Env) {
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

	equalTypes(a: InternalValue, b: InternalValue) {
		return (
			(a instanceof List && b instanceof List) ||
			(a instanceof Callable && b instanceof Callable) ||
			(a === null && b === null) ||
			(typeof a !== "object" &&
				typeof b !== "object" &&
				typeof a === typeof b)
		);
	}
}
