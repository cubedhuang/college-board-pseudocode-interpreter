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

	render(node: ASTNode | ASTNode[], join = "\n"): string {
		if (Array.isArray(node)) {
			return node.map(n => this.render(n)).join(join);
		}

		if (!(`visit${node.type}` in this)) {
			throw new Error(`No visit${node.type} method.`);
		}

		// @ts-expect-error
		return this[`visit${node.type}`].call(this, node);
	}

	visitExprLiteral(node: ExprLiteral): string {
		if (typeof node.value === "string") {
			return `"${node.value}"`;
		}
		return `${node.value}`;
	}

	visitExprBinary(node: ExprBinary): string {
		return `(${this.render(node.left)} ${node.op.lexeme} ${this.render(
			node.right
		)})`;
	}

	visitExprLogical(node: ExprLogical): string {
		return `(${this.render(node.left)} ${node.op.lexeme} ${this.render(
			node.right
		)})`;
	}

	visitExprUnary(node: ExprUnary): string {
		return `(${node.op.lexeme} ${this.render(node.right)})`;
	}

	visitExprVariable(node: ExprVariable): string {
		return `$${node.name.lexeme}`;
	}

	visitExprAssign(node: ExprAssign): string {
		return `($${node.name.lexeme} ← ${this.render(node.value)})`;
	}

	visitExprCall(node: ExprCall): string {
		return `(${this.render(node.callee)} (${this.render(
			node.args,
			", "
		)}))`;
	}

	visitExprList(node: ExprList): string {
		return `[${this.render(node.elements, ", ")}]`;
	}

	visitExprGetIndex(node: ExprGetIndex): string {
		return `(${this.render(node.list)}[${this.render(node.index)}])`;
	}

	visitExprSetIndex(node: ExprSetIndex): string {
		return `(${this.render(node.list)}[${this.render(
			node.index
		)}] ← ${this.render(node.value)})`;
	}

	visitStmtExpr(node: StmtExpr): string {
		return `EXPR ${this.render(node.expr)}`;
	}

	visitStmtProcedure(node: StmtProcedure): string {
		const start = `PROCEDURE $${node.name.lexeme} (${node.params
			.map(param => `$${param.lexeme}`)
			.join(", ")}) {\n`;

		this.indent++;
		const body = this.render(node.body);
		this.indent--;

		return `${start}${body}\n${this.indents}}`;
	}

	visitStmtIf(node: StmtIf): string {
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

	visitStmtRepeatTimes(node: StmtRepeatTimes): string {
		const start = `REPEAT ${this.render(node.times)} TIMES {\n`;

		this.indent++;
		const body = this.render(node.body);
		this.indent--;

		return `${start}${body}\n${this.indents}}`;
	}

	visitStmtRepeatUntil(node: StmtRepeatUntil): string {
		const start = `REPEAT UNTIL ${this.render(node.condition)} {\n`;

		this.indent++;
		const body = this.render(node.body);
		this.indent--;

		return `${start}${body}\n${this.indents}}`;
	}

	visitStmtForEach(node: StmtForEach): string {
		const start = `FOR EACH $${node.name.lexeme} in ${this.render(
			node.list
		)} {\n`;

		this.indent++;
		const body = this.render(node.body);
		this.indent--;

		return `${start}${body}\n${this.indents}}`;
	}

	visitStmtReturn(node: StmtReturn): string {
		return `RETURN ${this.render(node.value)}`;
	}

	get indents() {
		return "  ".repeat(this.indent);
	}
}
