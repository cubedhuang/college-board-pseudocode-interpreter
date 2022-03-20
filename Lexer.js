// @ts-check

import { Lang } from "./Lang.js";
import { Token, TokenType } from "./Token.js";

export class Lexer {
	static singleCharacterTokens = {
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

	static keywords = {
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

	/**
	 * @type {Token[]}
	 */
	tokens = [];

	/**
	 * @param {string} src
	 */
	constructor(src) {
		this.src = src;
	}

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

		Lang.error(this.line, this.col - 1, `Unexpected character: ${char}`);
	}

	makeNumber() {
		while (this.isNumber(this.peek())) {
			this.next();
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

	/**
	 * @param {TokenType} type
	 */
	addToken(type) {
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

	/**
	 * @param {string} char
	 */
	isNumber(char) {
		return char >= "0" && char <= "9";
	}

	/**
	 * @param {string} char
	 */
	isAlpha(char) {
		return (
			(char >= "a" && char <= "z") ||
			(char >= "A" && char <= "Z") ||
			char === "_"
		);
	}

	/**
	 * @param {string} char
	 */
	isAlphaNumeric(char) {
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
