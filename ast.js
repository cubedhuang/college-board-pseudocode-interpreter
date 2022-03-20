// @ts-check

import { Token } from "./Token.js";

/**
 * @typedef {import("./types").InternalValue} InternalValue
 */

export class ASTNode {
	get type() {
		return this.constructor.name;
	}
}

export class ExprLiteral extends ASTNode {
	/**
	 * @param {Token} token
	 * @param {InternalValue} value
	 */
	constructor(token, value) {
		super();
		this.token = token;
		this.value = value;
	}
}

export class ExprBinary extends ASTNode {
	/**
	 * @param {ASTNode} left
	 * @param {Token} op
	 * @param {ASTNode} right
	 */
	constructor(left, op, right) {
		super();
		this.left = left;
		this.op = op;
		this.right = right;
	}
}

export class ExprLogical extends ASTNode {
	/**
	 * @param {ASTNode} left
	 * @param {Token} op
	 * @param {ASTNode} right
	 */
	constructor(left, op, right) {
		super();
		this.left = left;
		this.op = op;
		this.right = right;
	}
}

export class ExprUnary extends ASTNode {
	/**
	 * @param {Token} op
	 * @param {ASTNode} right
	 */
	constructor(op, right) {
		super();
		this.op = op;
		this.right = right;
	}
}

export class ExprVariable extends ASTNode {
	/**
	 * @param {Token} name
	 */
	constructor(name) {
		super();
		this.name = name;
	}
}

export class ExprAssign extends ASTNode {
	/**
	 * @param {Token} name
	 * @param {ASTNode} value
	 */
	constructor(name, value) {
		super();
		this.name = name;
		this.value = value;
	}
}

export class ExprCall extends ASTNode {
	/**
	 * @param {ASTNode} callee
	 * @param {Token} paren
	 * @param {ASTNode[]} args
	 */
	constructor(callee, paren, args) {
		super();
		this.callee = callee;
		this.paren = paren;
		this.args = args;
	}
}

export class ExprList extends ASTNode {
	/**
	 * @param {ASTNode[]} elements
	 */
	constructor(elements) {
		super();
		this.elements = elements;
	}
}

export class ExprGetIndex extends ASTNode {
	/**
	 * @param {ASTNode} list
	 * @param {Token} brack
	 * @param {ASTNode} index
	 */
	constructor(list, brack, index) {
		super();
		this.list = list;
		this.brack = brack;
		this.index = index;
	}
}

export class ExprSetIndex extends ASTNode {
	/**
	 * @param {ASTNode} list
	 * @param {Token} brack
	 * @param {ASTNode} index
	 * @param {ASTNode} value
	 */
	constructor(list, brack, index, value) {
		super();
		this.list = list;
		this.brack = brack;
		this.index = index;
		this.value = value;
	}
}

export class StmtExpr extends ASTNode {
	/**
	 * @param {ASTNode} expr
	 */
	constructor(expr) {
		super();
		this.expr = expr;
	}
}

export class StmtProcedure extends ASTNode {
	/**
	 * @param {Token} name
	 * @param {Token[]} params
	 * @param {ASTNode[]} body
	 */
	constructor(name, params, body) {
		super();
		this.name = name;
		this.params = params;
		this.body = body;
	}
}

export class StmtIf extends ASTNode {
	/**
	 * @param {ASTNode} condition
	 * @param {ASTNode[]} thenBody
	 * @param {ASTNode[]} elseBody
	 */
	constructor(condition, thenBody, elseBody) {
		super();
		this.condition = condition;
		this.thenBody = thenBody;
		this.elseBody = elseBody;
	}
}

export class StmtRepeatTimes extends ASTNode {
	/**
	 * @param {ASTNode} times
	 * @param {ASTNode[]} body
	 */
	constructor(times, body) {
		super();
		this.times = times;
		this.body = body;
	}
}

export class StmtRepeatUntil extends ASTNode {
	/**
	 * @param {ASTNode} condition
	 * @param {ASTNode[]} body
	 */
	constructor(condition, body) {
		super();
		this.condition = condition;
		this.body = body;
	}
}

export class StmtForEach extends ASTNode {
	/**
	 * @param {Token} name
	 * @param {ASTNode} list
	 * @param {ASTNode[]} body
	 */
	constructor(name, list, body) {
		super();
		this.name = name;
		this.list = list;
		this.body = body;
	}
}

export class StmtReturn extends ASTNode {
	/**
	 * @param {ASTNode} value
	 */
	constructor(value) {
		super();
		this.value = value;
	}
}
