import type { Token } from "./Token";
import type { InternalValue } from "./types";

export class ASTNode {
	constructor(public readonly type: string) {}
}

export class ExprLiteral extends ASTNode {
	constructor(public token: Token, public value: InternalValue) {
		super("ExprLiteral");
	}
}

export class ExprBinary extends ASTNode {
	constructor(public left: ASTNode, public op: Token, public right: ASTNode) {
		super("ExprBinary");
	}
}

export class ExprLogical extends ASTNode {
	constructor(public left: ASTNode, public op: Token, public right: ASTNode) {
		super("ExprLogical");
	}
}

export class ExprUnary extends ASTNode {
	constructor(public op: Token, public right: ASTNode) {
		super("ExprUnary");
	}
}

export class ExprVariable extends ASTNode {
	constructor(public name: Token) {
		super("ExprVariable");
	}
}

export class ExprAssign extends ASTNode {
	constructor(public name: Token, public value: ASTNode) {
		super("ExprAssign");
	}
}

export class ExprCall extends ASTNode {
	constructor(
		public callee: ASTNode,
		public paren: Token,
		public args: ASTNode[]
	) {
		super("ExprCall");
	}
}

export class ExprList extends ASTNode {
	constructor(public elements: ASTNode[]) {
		super("ExprList");
	}
}

export class ExprGetIndex extends ASTNode {
	constructor(
		public list: ASTNode,
		public brack: Token,
		public index: ASTNode
	) {
		super("ExprGetIndex");
	}
}

export class ExprSetIndex extends ASTNode {
	constructor(
		public list: ASTNode,
		public brack: Token,
		public index: ASTNode,
		public value: ASTNode
	) {
		super("ExprSetIndex");
	}
}

export class StmtProcedure extends ASTNode {
	constructor(
		public name: Token,
		public params: Token[],
		public body: ASTNode[]
	) {
		super("StmtProcedure");
	}
}

export class StmtIf extends ASTNode {
	constructor(
		public condition: ASTNode,
		public thenBody: ASTNode[],
		public elseBody?: ASTNode[]
	) {
		super("StmtIf");
	}
}

export class StmtRepeatTimes extends ASTNode {
	constructor(
		public times: ASTNode,
		public token: Token,
		public body: ASTNode[]
	) {
		super("StmtRepeatTimes");
	}
}

export class StmtRepeatUntil extends ASTNode {
	constructor(public condition: ASTNode, public body: ASTNode[]) {
		super("StmtRepeatUntil");
	}
}

export class StmtForEach extends ASTNode {
	constructor(
		public name: Token,
		public token: Token,
		public list: ASTNode,
		public body: ASTNode[]
	) {
		super("StmtForEach");
	}
}

export class StmtReturn extends ASTNode {
	constructor(public token: Token, public value: ASTNode) {
		super("StmtReturn");
	}
}
