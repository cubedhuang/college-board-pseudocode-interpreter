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
import { Lang } from "./Lang.js";
import { Token, TokenType } from "./Token.js";

export class ParseError extends Error {
	/**
	 * @param {Token} token
	 * @param {string} message
	 */
	constructor(token, message) {
		super(message);
		this.token = token;
	}
}

export class Parser {
	/**
	 * @param {Token[]} tokens
	 */
	constructor(tokens) {
		this.tokens = tokens;
		this.i = 0;
	}

	parse() {
		try {
			return this.program();
		} catch (err) {
			if (err instanceof ParseError) {
				Lang.error(err.token.line, err.token.col, err.message);
				return;
			}

			throw err;
		}
	}

	program() {
		const statements = this.statements();

		if (!this.isAtEnd()) {
			throw new ParseError(
				this.peek(),
				`Unexpected token: '${this.peek().lexeme}'`
			);
		}

		return statements;
	}

	statements() {
		const statements = [];

		while (!this.isAtEnd() && !this.check(TokenType.RBRACE)) {
			statements.push(this.statement());
		}

		return statements;
	}

	block(name = "block") {
		this.consume(TokenType.LBRACE, `Expected '{' before ${name}.`);

		if (this.match(TokenType.RBRACE)) {
			return [];
		}

		const statements = this.statements();
		this.consume(TokenType.RBRACE, `Expected '}' after ${name}.`);

		return statements;
	}

	statement() {
		if (this.match(TokenType.PROCEDURE)) return this.procedureStmt();
		if (this.match(TokenType.IF)) return this.ifStmt();
		if (this.match(TokenType.REPEAT)) return this.repeatStmt();
		if (this.match(TokenType.FOR)) return this.forEachStmt();
		if (this.match(TokenType.RETURN)) return this.returnStmt();

		return new StmtExpr(this.expr());
	}

	/**
	 * @returns {StmtProcedure}
	 */
	procedureStmt() {
		const name = this.consume(TokenType.ID, "Expected procedure name.");

		this.consume(TokenType.LPAREN, "Expected '(' after procedure name.");

		const parameters = [];

		if (!this.check(TokenType.RPAREN)) {
			do {
				parameters.push(
					this.consume(TokenType.ID, "Expected parameter name.")
				);
			} while (this.match(TokenType.COMMA));
		}

		this.consume(TokenType.RPAREN, "Expected ')' after parameters.");

		const body = this.block("procedure body");

		return new StmtProcedure(name, parameters, body);
	}

	/**
	 * @returns {StmtIf}
	 */
	ifStmt() {
		this.consume(TokenType.LPAREN, "Expected '(' after 'IF'.");

		const condition = this.expr();

		this.consume(TokenType.RPAREN, "Expected ')' after condition.");

		const thenBranch = this.block("then branch");

		let elseBranch;

		if (this.match(TokenType.ELSE)) {
			elseBranch = this.block("else branch");
		}

		return new StmtIf(condition, thenBranch, elseBranch);
	}

	/**
	 * @returns {StmtRepeatUntil | StmtRepeatTimes}
	 */
	repeatStmt() {
		if (this.match(TokenType.UNTIL)) {
			this.consume(TokenType.LPAREN, "Expected '(' after 'UNTIL'.");

			const condition = this.expr();

			this.consume(TokenType.RPAREN, "Expected ')' after condition.");

			const body = this.block("repeat body");

			return new StmtRepeatUntil(condition, body);
		}

		const times = this.expr();

		this.consume(TokenType.TIMES, "Expected 'TIMES' after expression.");

		const body = this.block("repeat body");

		return new StmtRepeatTimes(times, body);
	}

	/**
	 * @returns {ASTNode}
	 */
	forEachStmt() {
		this.consume(TokenType.EACH, "Expected 'EACH' after 'FOR'.");

		const variable = this.consume(
			TokenType.ID,
			"Expected variable name after 'EACH'."
		);

		const inToken = this.consume(
			TokenType.IN,
			"Expected 'IN' after variable name."
		);

		const list = this.expr();

		const body = this.block("for each body");

		return new StmtForEach(variable, inToken, list, body);
	}

	returnStmt() {
		const token = this.previous();

		this.consume(TokenType.LPAREN, "Expected '(' after 'RETURN'.");

		const value = this.expr();

		this.consume(TokenType.RPAREN, "Expected ')' after return value.");

		return new StmtReturn(token, value);
	}

	expr() {
		return this.assign();
	}

	/**
	 * @returns {ASTNode}
	 */
	assign() {
		const expr = this.or();

		if (this.match(TokenType.ASSIGN)) {
			const token = this.previous();
			const value = this.assign();

			if (expr instanceof ExprVariable) {
				return new ExprAssign(expr.name, value);
			} else if (expr instanceof ExprGetIndex) {
				return new ExprSetIndex(
					expr.list,
					expr.brack,
					expr.index,
					value
				);
			}

			throw new ParseError(token, "Invalid assignment target.");
		}

		return expr;
	}

	or() {
		return this.binary(ExprLogical, this.and, [TokenType.OR]);
	}

	and() {
		return this.binary(ExprLogical, this.not, [TokenType.AND]);
	}

	not() {
		if (this.match(TokenType.NOT)) {
			const operator = this.previous();
			const right = this.not();

			return new ExprUnary(operator, right);
		}

		return this.equality();
	}

	equality() {
		return this.binary(ExprBinary, this.comparison, [
			TokenType.EQ,
			TokenType.NEQ
		]);
	}

	comparison() {
		return this.binary(ExprBinary, this.arith, [
			TokenType.LT,
			TokenType.GT,
			TokenType.LE,
			TokenType.GE
		]);
	}

	arith() {
		return this.binary(ExprBinary, this.term, [
			TokenType.PLUS,
			TokenType.MINUS
		]);
	}

	term() {
		return this.binary(ExprBinary, this.factor, [
			TokenType.STAR,
			TokenType.SLASH,
			TokenType.MOD
		]);
	}

	/**
	 * @returns {ASTNode}
	 */
	factor() {
		if (this.match(TokenType.MINUS)) {
			const operator = this.previous();
			const right = this.call();

			return new ExprUnary(operator, right);
		}

		return this.call();
	}

	call() {
		let expr = this.primary();

		while (true) {
			if (this.match(TokenType.LPAREN)) {
				const args = [];

				if (!this.check(TokenType.RPAREN)) {
					do {
						args.push(this.expr());
					} while (this.match(TokenType.COMMA));
				}

				this.consume(TokenType.RPAREN, "Expected ')' after arguments.");

				expr = new ExprCall(expr, this.previous(), args);
			} else if (this.match(TokenType.LBRACK)) {
				const brack = this.previous();
				const index = this.expr();

				this.consume(TokenType.RBRACK, "Expected ']' after index.");

				expr = new ExprGetIndex(expr, brack, index);
			} else {
				break;
			}
		}

		return expr;
	}

	/**
	 * @returns {ASTNode}
	 */
	primary() {
		if (this.match(TokenType.FALSE))
			return new ExprLiteral(this.previous(), false);
		if (this.match(TokenType.TRUE))
			return new ExprLiteral(this.previous(), true);

		if (this.match(TokenType.NUMBER)) {
			const token = this.previous();

			return new ExprLiteral(this.previous(), parseFloat(token.lexeme));
		}

		if (this.match(TokenType.ID)) {
			return new ExprVariable(this.previous());
		}

		if (this.match(TokenType.LPAREN)) {
			const expr = this.expr();
			this.consume(TokenType.RPAREN, "Expected ')' after expression.");

			return expr;
		}

		if (this.match(TokenType.LBRACK)) {
			return this.list();
		}

		throw new ParseError(
			this.peek(),
			`Expected expression, but got '${this.peek().lexeme}'.`
		);
	}

	list() {
		const elements = [];

		if (!this.check(TokenType.RBRACK)) {
			do {
				elements.push(this.expr());
			} while (this.match(TokenType.COMMA));
		}

		this.consume(TokenType.RBRACK, "Expected ']' after list elements.");

		return new ExprList(elements);
	}

	/**
	 * @param {typeof ExprBinary | typeof ExprLogical} ClassType
	 * @param {() => ASTNode} leftExpr
	 * @param {TokenType[]} operators
	 * @param {() => ASTNode} rightExpr
	 */
	binary(ClassType, leftExpr, operators, rightExpr = leftExpr) {
		leftExpr = leftExpr.bind(this);
		rightExpr = rightExpr.bind(this);

		let expr = leftExpr();

		while (this.match(...operators)) {
			const operator = this.previous();
			const right = rightExpr();

			expr = new ClassType(expr, operator, right);
		}

		return expr;
	}

	/**
	 * @param {TokenType} type
	 * @param {string} message
	 */
	consume(type, message) {
		if (this.check(type)) return this.next();
		throw new ParseError(this.peek(), message);
	}

	/**
	 * @param {...TokenType} types
	 */
	match(...types) {
		if (this.check(...types)) {
			this.next();
			return true;
		}

		return false;
	}

	/**
	 * @param {...TokenType} types
	 */
	check(...types) {
		return types.includes(this.peek().type);
	}

	next() {
		return this.tokens[this.i++];
	}

	previous() {
		return this.tokens[this.i - 1];
	}

	peek() {
		return this.tokens[this.i];
	}

	isAtEnd() {
		return this.peek().type === TokenType.EOF;
	}
}
