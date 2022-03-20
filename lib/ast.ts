import type { Token } from "./Token";
import type { InternalValue } from "./types";

export class ASTNode {
	get type() {
		return this.constructor.name;
	}
}

export class ExprLiteral extends ASTNode {
	constructor(public token: Token, public value: InternalValue) {
		super();
	}
}

export class ExprBinary extends ASTNode {
	constructor(public left: ASTNode, public op: Token, public right: ASTNode) {
		super();
	}
}

export class ExprLogical extends ASTNode {
	constructor(public left: ASTNode, public op: Token, public right: ASTNode) {
		super();
	}
}

export class ExprUnary extends ASTNode {
	constructor(public op: Token, public right: ASTNode) {
		super();
	}
}

export class ExprVariable extends ASTNode {
	constructor(public name: Token) {
		super();
	}
}

export class ExprAssign extends ASTNode {
	constructor(public name: Token, public value: ASTNode) {
		super();
	}
}

export class ExprCall extends ASTNode {
	constructor(
		public callee: ASTNode,
		public paren: Token,
		public args: ASTNode[]
	) {
		super();
	}
}

export class ExprList extends ASTNode {
	constructor(public elements: ASTNode[]) {
		super();
	}
}

export class ExprGetIndex extends ASTNode {
	constructor(
		public list: ASTNode,
		public brack: Token,
		public index: ASTNode
	) {
		super();
	}
}

export class ExprSetIndex extends ASTNode {
	constructor(
		public list: ASTNode,
		public brack: Token,
		public index: ASTNode,
		public value: ASTNode
	) {
		super();
	}
}

export class StmtExpr extends ASTNode {
	constructor(public expr: ASTNode) {
		super();
	}
}

export class StmtProcedure extends ASTNode {
	constructor(
		public name: Token,
		public params: Token[],
		public body: ASTNode[]
	) {
		super();
	}
}

export class StmtIf extends ASTNode {
	constructor(
		public condition: ASTNode,
		public thenBody: ASTNode[],
		public elseBody?: ASTNode[]
	) {
		super();
	}
}

export class StmtRepeatTimes extends ASTNode {
	constructor(
		public times: ASTNode,
		public token: Token,
		public body: ASTNode[]
	) {
		super();
	}
}

export class StmtRepeatUntil extends ASTNode {
	constructor(public condition: ASTNode, public body: ASTNode[]) {
		super();
	}
}

export class StmtForEach extends ASTNode {
	constructor(
		public name: Token,
		public inToken: Token,
		public list: ASTNode,
		public body: ASTNode[]
	) {
		super();
	}
}

export class StmtReturn extends ASTNode {
	constructor(public token: Token, public value: ASTNode) {
		super();
	}
}
