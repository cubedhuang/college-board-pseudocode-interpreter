import type { Lang } from "./Lang";
import { Token, TokenType } from "./Token";

export class Lexer {
	static singleCharacterTokens: Record<string, TokenType> = {
		"←": TokenType.ASSIGN,
		"=": TokenType.EQ,
		"≠": TokenType.NEQ,
		"<": TokenType.LT,
		"≤": TokenType.LE,
		">": TokenType.GT,
		"≥": TokenType.GE,
		"+": TokenType.PLUS,
		"-": TokenType.MINUS,
		"*": TokenType.STAR,
		"/": TokenType.SLASH,
		"(": TokenType.LPAREN,
		")": TokenType.RPAREN,
		"{": TokenType.LBRACE,
		"}": TokenType.RBRACE,
		"[": TokenType.LBRACK,
		"]": TokenType.RBRACK,
		",": TokenType.COMMA
	};

	static keywords: Record<string, TokenType> = {
		AND: TokenType.AND,
		EACH: TokenType.EACH,
		ELSE: TokenType.ELSE,
		false: TokenType.FALSE,
		FOR: TokenType.FOR,
		IF: TokenType.IF,
		IN: TokenType.IN,
		MOD: TokenType.MOD,
		NOT: TokenType.NOT,
		OR: TokenType.OR,
		PROCEDURE: TokenType.PROCEDURE,
		REPEAT: TokenType.REPEAT,
		RETURN: TokenType.RETURN,
		TIMES: TokenType.TIMES,
		true: TokenType.TRUE,
		UNTIL: TokenType.UNTIL
	};

	start = 0;
	current = 0;
	line = 1;
	col = 1;

	tokens: Token[] = [];

	constructor(public lang: Lang, public src: string) {}

	makeTokens() {
		while (this.current < this.src.length) {
			this.start = this.current;
			this.makeToken();
		}

		this.tokens.push(new Token(TokenType.EOF, "", this.line, this.col));

		return this.tokens;
	}

	makeToken() {
		const char = this.next();

		if (char === "\n") {
			this.line++;
			this.col = 1;
			return;
		}

		if (char === "\t") {
			this.col += 3;
			return;
		}

		if (char === " " || char === "\r") {
			return;
		}

		if (char in Lexer.singleCharacterTokens) {
			this.addToken(Lexer.singleCharacterTokens[char]);
			return;
		}

		if (this.isNumber(char)) {
			this.makeNumber();
			return;
		}

		if (this.isAlpha(char)) {
			this.makeIdentifier();
			return;
		}

		if (char === '"') {
			this.makeString();
			return;
		}

		this.lang.error(
			this.line,
			this.col - 1,
			`Unexpected character: ${char}`
		);
	}

	makeNumber() {
		while (this.isNumber(this.peek())) {
			this.next();
		}

		if (this.peek() === ".") {
			this.next();

			if (!this.isNumber(this.peek())) {
				this.lang.error(
					this.line,
					this.col - 1,
					"Invalid number termination."
				);
			}

			while (this.isNumber(this.peek())) {
				this.next();
			}
		}

		this.addToken(TokenType.NUMBER);
	}

	makeIdentifier() {
		while (this.isAlphaNumeric(this.peek())) {
			this.next();
		}

		const text = this.src.substring(this.start, this.current);

		if (text in Lexer.keywords) {
			this.addToken(Lexer.keywords[text]);
		} else {
			this.addToken(TokenType.ID);
		}
	}

	makeString() {
		while (this.peek() && this.peek() !== '"') {
			if (this.peek() === "\n") {
				this.line++;
				this.col = 1;
			} else if (this.peek() === "\t") {
				this.col += 3;
			}

			this.next();
		}

		if (!this.peek()) {
			this.lang.error(this.line, this.col - 1, "Unterminated string.");
		}

		this.next();

		this.addToken(TokenType.STRING);
	}

	addToken(type: TokenType) {
		const col = this.col - (this.current - this.start);

		this.tokens.push(
			new Token(
				type,
				this.src.substring(this.start, this.current),
				this.line,
				col < 1 ? 1 : col
			)
		);
	}

	isNumber(char: string) {
		return char >= "0" && char <= "9";
	}

	isAlpha(char: string) {
		return (
			(char >= "a" && char <= "z") ||
			(char >= "A" && char <= "Z") ||
			char === "_"
		);
	}

	isAlphaNumeric(char: string) {
		return this.isNumber(char) || this.isAlpha(char);
	}

	next() {
		this.col++;
		return this.src[this.current++];
	}

	peek() {
		return this.src[this.current];
	}
}
