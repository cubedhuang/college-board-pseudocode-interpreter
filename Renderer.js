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

export class Renderer {
	indent = 0;

	/**
	 * @param {ASTNode | ASTNode[]} node
	 * @returns {string}
	 */
	render(node, join = "\n") {
		if (Array.isArray(node)) {
			return node.map(n => this.render(n)).join(join);
		}

		if (!this[`visit${node.type}`]) {
			throw new Error(`Unknown node type: ${node.type}`);
		}

		return (
			(node.type.includes("Stmt") ? this.indents : "") +
			this[`visit${node.type}`].call(this, node)
		);
	}

	/**
	 * @param {ExprLiteral} node
	 * @returns {string}
	 */
	visitExprLiteral(node) {
		if (typeof node.value === "string") {
			return `"${node.value}"`;
		}
		return `${node.value}`;
	}

	/**
	 * @param {ExprBinary} node
	 * @returns {string}
	 */
	visitExprBinary(node) {
		return `(${this.render(node.left)} ${node.op.lexeme} ${this.render(
			node.right
		)})`;
	}

	/**
	 * @param {ExprLogical} node
	 * @returns {string}
	 */
	visitExprLogical(node) {
		return `(${this.render(node.left)} ${node.op.lexeme} ${this.render(
			node.right
		)})`;
	}

	/**
	 * @param {ExprUnary} node
	 * @returns {string}
	 */
	visitExprUnary(node) {
		return `(${node.op.lexeme} ${this.render(node.right)})`;
	}

	/**
	 * @param {ExprVariable} node
	 * @returns {string}
	 */
	visitExprVariable(node) {
		return `$${node.name.lexeme}`;
	}

	/**
	 * @param {ExprAssign} node
	 * @returns {string}
	 */
	visitExprAssign(node) {
		return `($${node.name.lexeme} ← ${this.render(node.value)})`;
	}

	/**
	 * @param {ExprCall} node
	 * @returns {string}
	 */
	visitExprCall(node) {
		return `(${this.render(node.callee)} (${this.render(
			node.args,
			", "
		)}))`;
	}

	/**
	 * @param {ExprList} node
	 * @returns {string}
	 */
	visitExprList(node) {
		return `[${this.render(node.elements, ", ")}]`;
	}

	/**
	 * @param {ExprGetIndex} node
	 * @returns {string}
	 */
	visitExprGetIndex(node) {
		return `(${this.render(node.list)}[${this.render(node.index)}])`;
	}

	/**
	 * @param {ExprSetIndex} node
	 * @returns {string}
	 */
	visitExprSetIndex(node) {
		return `(${this.render(node.list)}[${this.render(
			node.index
		)}] ← ${this.render(node.value)})`;
	}

	/**
	 * @param {StmtExpr} node
	 * @returns {string}
	 */
	visitStmtExpr(node) {
		return `EXPR ${this.render(node.expr)}`;
	}

	/**
	 * @param {StmtProcedure} node
	 * @returns {string}
	 */
	visitStmtProcedure(node) {
		const start = `PROCEDURE $${node.name.lexeme} (${node.params
			.map(param => `$${param.lexeme}`)
			.join(", ")}) {\n`;

		this.indent++;
		const body = this.render(node.body);
		this.indent--;

		return `${start}${body}\n${this.indents}}`;
	}

	/**
	 * @param {StmtIf} node
	 * @returns {string}
	 */
	visitStmtIf(node) {
		const start = `IF ${this.render(node.condition)} {\n`;

		this.indent++;
		const thenBody = this.render(node.thenBody);

		if (!node.elseBody) {
			this.indent--;
			return `${start}${thenBody}\n${this.indents}}`;
		}

		const elseBody = node.elseBody ? this.render(node.elseBody) : "";
		this.indent--;

		return `${start}${thenBody}\n${this.indents}} ELSE {\n${elseBody}\n${this.indents}}`;
	}

	/**
	 * @param {StmtRepeatTimes} node
	 * @returns {string}
	 */
	visitStmtRepeatTimes(node) {
		const start = `REPEAT ${this.render(node.times)} TIMES {\n`;

		this.indent++;
		const body = this.render(node.body);
		this.indent--;

		return `${start}${body}\n${this.indents}}`;
	}

	/**
	 * @param {StmtRepeatUntil} node
	 * @returns {string}
	 */
	visitStmtRepeatUntil(node) {
		const start = `REPEAT UNTIL ${this.render(node.condition)} {\n`;

		this.indent++;
		const body = this.render(node.body);
		this.indent--;

		return `${start}${body}\n${this.indents}}`;
	}

	/**
	 * @param {StmtForEach} node
	 * @returns {string}
	 */
	visitStmtForEach(node) {
		const start = `FOR EACH $${node.name.lexeme} in ${this.render(
			node.list
		)} {\n`;

		this.indent++;
		const body = this.render(node.body);
		this.indent--;

		return `${start}${body}\n${this.indents}}`;
	}

	/**
	 * @param {StmtReturn} node
	 * @returns {string}
	 */
	visitStmtReturn(node) {
		return `RETURN ${this.render(node.value)}`;
	}

	get indents() {
		return "  ".repeat(this.indent);
	}
}
