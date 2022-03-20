// @ts-check

const next = (() => {
	let i = 0;
	return () => i++;
})();

/**
 * @readonly
 * @enum {number}
 */
export const TokenType = {
	EOF: next(),

	// Symbols.
	LPAREN: next(),
	RPAREN: next(),
	LBRACE: next(),
	RBRACE: next(),
	LBRACK: next(),
	RBRACK: next(),
	COMMA: next(),

	// Operators.
	PLUS: next(),
	MINUS: next(),
	STAR: next(),
	SLASH: next(),
	MOD: next(),
	ASSIGN: next(),
	EQ: next(),
	NEQ: next(),
	LT: next(),
	LE: next(),
	GT: next(),
	GE: next(),
	NOT: next(),
	AND: next(),
	OR: next(),

	// Types.
	NUMBER: next(),
	ID: next(),
	STRING: next(),
	FALSE: next(),
	TRUE: next(),

	// Keywords.
	EACH: next(),
	ELSE: next(),
	FOR: next(),
	IF: next(),
	IN: next(),
	PROCEDURE: next(),
	REPEAT: next(),
	RETURN: next(),
	TIMES: next(),
	UNTIL: next()
};

export class Token {
	static reverseTokenType = Object.fromEntries(
		Object.entries(TokenType).map(([k, v]) => [v, k])
	);

	/**
	 * @param {TokenType} type
	 * @param {string} lexeme
	 * @param {number} line
	 * @param {number} col
	 */
	constructor(type, lexeme, line, col) {
		this.type = type;
		this.lexeme = lexeme;
		this.line = line;
		this.col = col;
	}

	toString() {
		return `${Token.reverseTokenType[this.type].padEnd(10)} '${
			this.lexeme
		}'`;
	}
}
