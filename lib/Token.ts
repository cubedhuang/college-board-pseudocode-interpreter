export enum TokenType {
	EOF,

	// Symbols.
	LPAREN,
	RPAREN,
	LBRACE,
	RBRACE,
	LBRACK,
	RBRACK,
	COMMA,

	// Operators.
	PLUS,
	MINUS,
	STAR,
	SLASH,
	MOD,
	ASSIGN,
	EQ,
	NEQ,
	LT,
	LE,
	GT,
	GE,
	NOT,
	AND,
	OR,

	// Types.
	NUMBER,
	ID,
	STRING,
	FALSE,
	TRUE,

	// Keywords.
	EACH,
	ELSE,
	FOR,
	IF,
	IN,
	PROCEDURE,
	REPEAT,
	RETURN,
	TIMES,
	UNTIL
}

export class Token {
	constructor(
		public type: TokenType,
		public lexeme: string,
		public line: number,
		public col: number
	) {}

	toString() {
		return `${TokenType[this.type].padEnd(10)} '${this.lexeme}'`;
	}
}
