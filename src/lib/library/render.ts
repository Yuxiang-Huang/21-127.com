import katex from "katex";

const MACROS: Record<string, string> = {
	"\\im": "\\operatorname{Im}",
	"\\preim": "\\operatorname{PreIm}",
	"\\lcm": "\\operatorname{lcm}",
	"\\id": "\\operatorname{id}",
	"\\ord": "\\operatorname{ord}",
	"\\sminus": "\\smallsetminus",
	"\\ceil": "\\lceil #1 \\rceil",
	"\\floor": "\\lfloor #1 \\rfloor",
};

const MATH_ENVS = new Set([
	"align",
	"align*",
	"equation",
	"equation*",
	"gather",
	"gather*",
	"cases",
	"aligned",
]);

const TEXT_WRAPPERS: Record<string, string> = {
	textbf: "strong",
	textit: "em",
	emph: "em",
	underline: "u",
};

export type InlineProblem = {
	promptHtml: string;
	solutionHtml: string;
};

export type RenderedTex = {
	title: string;
	html: string;
	solutionHtml: string | null;
	inlineProblems: InlineProblem[] | null;
};

export function renderTex(source: string, file: string): RenderedTex {
	const normalized = source.replace(/\r\n/g, "\n");
	const document = stripDocument(normalized, file);
	const { title, body } = extractSection(document, file);
	const enumerated = extractEnumeratedSolutions(body, file);
	if (enumerated) {
		return {
			title,
			html: new Parser(enumerated.intro, file).parseContent(() => false),
			solutionHtml: null,
			inlineProblems: enumerated.items.map((item) => ({
				promptHtml: new Parser(item.prompt, file).parseContent(() => false),
				solutionHtml: new Parser(item.solution, file).parseContent(() => false),
			})),
		};
	}
	const { body: statement, solution } = extractSolution(body, file);
	return {
		title,
		html: new Parser(statement, file).parseContent(() => false),
		solutionHtml:
			solution === null
				? null
				: new Parser(solution, file).parseContent(() => false),
		inlineProblems: null,
	};
}

function stripDocument(source: string, file: string): string {
	const withoutInput = source.replace(/\\input\s*\{[^}]*\}/g, "");
	const begin = withoutInput.match(/\\begin\s*\{document\}/);
	const end = withoutInput.match(/\\end\s*\{document\}/);
	if (
		!begin ||
		!end ||
		begin.index === undefined ||
		end.index === undefined ||
		end.index < begin.index
	) {
		throw new Error(`${file}: expected a document environment`);
	}
	return withoutInput.slice(begin.index + begin[0].length, end.index);
}

function extractSection(
	source: string,
	file: string,
): { title: string; body: string } {
	const { body, groups } = extractGroups(source, "\\section*", file);
	if (groups.length !== 1) {
		throw new Error(
			`${file}: expected one \\section*, found ${groups.length}`,
		);
	}
	const title = groups[0].replace(/\s+/g, " ").trim();
	if (!title) throw new Error(`${file}: empty \\section* title`);
	return { title, body };
}

function extractSolution(
	source: string,
	file: string,
): { body: string; solution: string | null } {
	const { body, groups } = extractGroups(source, "\\showsolution", file);
	if (groups.length > 1) {
		throw new Error(`${file}: more than one \\showsolution`);
	}
	return { body, solution: groups[0] ?? null };
}

function extractEnumeratedSolutions(
	source: string,
	file: string,
): { intro: string; items: { prompt: string; solution: string }[] } | null {
	const { groups } = extractGroups(source, "\\showsolution", file);
	if (groups.length < 2) return null;
	const beginToken = "\\begin{enumerate}";
	const endToken = "\\end{enumerate}";
	const begin = source.indexOf(beginToken);
	const end = source.lastIndexOf(endToken);
	if (
		begin < 0 ||
		end < begin ||
		source.slice(0, begin).includes("\\showsolution") ||
		source.slice(end + endToken.length).trim()
	) {
		throw new Error(
			`${file}: multiple solutions must sit inside one enumerate`,
		);
	}
	const list = source.slice(begin + beginToken.length, end);
	const items = splitItems(list, file).map((item) => {
		const extracted = extractGroups(item, "\\showsolution", file);
		if (extracted.groups.length !== 1) {
			throw new Error(`${file}: each enumerated item needs one solution`);
		}
		return { prompt: extracted.body, solution: extracted.groups[0] ?? "" };
	});
	return { intro: source.slice(0, begin), items };
}

function splitItems(source: string, file: string): string[] {
	const parts: string[] = [];
	let depth = 0;
	let i = 0;
	let start = -1;
	while (i < source.length) {
		if (source[i] === "\\") {
			if (
				depth === 0 &&
				source.startsWith("\\item", i) &&
				!/[a-zA-Z]/.test(source[i + 5] ?? "")
			) {
				if (start >= 0) parts.push(source.slice(start, i));
				i += "\\item".length;
				i = skipItemLabel(source, i);
				start = i;
				continue;
			}
			i += Math.min(2, source.length - i);
			continue;
		}
		if (source[i] === "{") depth++;
		else if (source[i] === "}") {
			depth--;
			if (depth < 0) throw new Error(`${file}: unbalanced braces`);
		}
		i++;
	}
	if (start >= 0) parts.push(source.slice(start));
	if (parts.length === 0) {
		throw new Error(`${file}: enumerate has no items`);
	}
	return parts;
}

function skipItemLabel(source: string, index: number): number {
	let i = index;
	while (source[i] === " " || source[i] === "\t" || source[i] === "\n") i++;
	if (source[i] !== "[") return index;
	const close = source.indexOf("]", i + 1);
	return close < 0 ? index : close + 1;
}

function extractGroups(
	source: string,
	command: string,
	file: string,
): { body: string; groups: string[] } {
	const groups: string[] = [];
	let body = "";
	let i = 0;
	while (i < source.length) {
		if (
			source.startsWith(command, i) &&
			!/[a-zA-Z]/.test(source[i + command.length] ?? "")
		) {
			let j = i + command.length;
			while (source[j] === " " || source[j] === "\n" || source[j] === "\t") {
				j++;
			}
			if (source[j] !== "{") {
				throw new Error(`${file}: ${command} is missing its braces`);
			}
			const group = readBraces(source, j, file);
			groups.push(group.inner);
			i = group.next;
		} else {
			body += source[i];
			i++;
		}
	}
	return { body, groups };
}

function readBraces(
	source: string,
	open: number,
	file: string,
): { inner: string; next: number } {
	if (source[open] !== "{") throw new Error(`${file}: expected {`);
	let depth = 0;
	for (let i = open; i < source.length; i++) {
		if (source[i] === "\\") {
			i++;
			continue;
		}
		if (source[i] === "{") depth++;
		else if (source[i] === "}") {
			depth--;
			if (depth === 0) {
				return { inner: source.slice(open + 1, i), next: i + 1 };
			}
		}
	}
	throw new Error(`${file}: unbalanced braces`);
}

function renderMath(tex: string, display: boolean, file: string): string {
	const source = rewriteTags(tex, file).trim();
	if (!source) throw new Error(`${file}: empty math`);
	try {
		return katex.renderToString(source, {
			displayMode: display,
			throwOnError: true,
			macros: { ...MACROS },
			output: "htmlAndMathml",
			strict: "ignore",
		});
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		throw new Error(`${file}: ${message}\n${source}`);
	}
}

function rewriteTags(tex: string, file: string): string {
	let out = "";
	let i = 0;
	while (i < tex.length) {
		if (tex.startsWith("\\tag", i) && !/[a-zA-Z]/.test(tex[i + 4] ?? "")) {
			let j = i + 4;
			while (tex[j] === " " || tex[j] === "\n" || tex[j] === "\t") j++;
			if (tex[j] !== "{") throw new Error(`${file}: \\tag is missing its braces`);
			const group = readBraces(tex, j, file);
			out += tagReplacement(group.inner, file);
			i = group.next;
		} else {
			out += tex[i];
			i++;
		}
	}
	return out;
}

function tagReplacement(body: string, file: string): string {
	const parts: string[] = [];
	let text = "(";
	let i = 0;
	while (i < body.length) {
		if (body[i] === "$") {
			pushTagText(parts, text);
			text = "";
			const close = body.indexOf("$", i + 1);
			if (close < 0) throw new Error(`${file}: unclosed $ inside \\tag`);
			parts.push(body.slice(i + 1, close));
			i = close + 1;
		} else {
			text += body[i];
			i++;
		}
	}
	pushTagText(parts, `${text})`);
	return `\\quad ${parts.join("")}`;
}

function pushTagText(parts: string[], text: string) {
	if (!text) return;
	const escaped = text.replace(/([\\{}])/g, "\\$1");
	parts.push(`\\text{${escaped}}`);
}

function escapeHtml(text: string): string {
	return text
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;");
}

class Parser {
	private i = 0;

	constructor(
		private readonly src: string,
		private readonly file: string,
	) {}

	parseContent(stop: () => boolean): string {
		const blocks: string[] = [];
		while (this.i < this.src.length && !stop()) {
			this.skipBlankLines();
			if (this.i >= this.src.length || stop()) break;
			if (this.peekListBegin()) blocks.push(this.parseList());
			else {
				const paragraph = this.parseParagraph(stop);
				if (paragraph) blocks.push(paragraph);
				else if (!stop() && !this.peekListBegin() && !this.atBlankBreak()) {
					throw this.fail("parser made no progress");
				}
			}
		}
		return blocks.join("\n");
	}

	private parseParagraph(stop: () => boolean): string {
		const chunks: string[] = [];
		while (this.i < this.src.length && !stop()) {
			if (this.peekListBegin()) break;
			const token = this.parseToken(true);
			if (token === null) break;
			chunks.push(token);
		}
		const html = chunks.join("").replace(/^[ \n]+|[ \n]+$/g, "");
		if (!html) return "";
		return `<p>${html}</p>`;
	}

	renderInlines(): string {
		const chunks: string[] = [];
		while (this.i < this.src.length) {
			if (this.peekListBegin()) {
				throw this.fail("list inside a text command");
			}
			const token = this.parseToken(false);
			if (token === null) throw this.fail("parser made no progress");
			chunks.push(token);
		}
		return chunks.join("").replace(/^[ \n]+|[ \n]+$/g, "");
	}

	private parseList(): string {
		const env = this.peekListBegin();
		if (!env) throw this.fail("expected a list");
		this.i += `\\begin{${env}}`.length;
		const items: string[] = [];
		while (true) {
			this.skipWhitespace();
			if (this.i >= this.src.length) throw this.fail(`unclosed ${env}`);
			if (this.peekCommand("end")) {
				this.consumeEnd(env);
				break;
			}
			if (!this.peekCommand("item")) throw this.fail("expected \\item");
			this.i += "\\item".length;
			const label = this.readItemLabel();
			const inner = this.parseContent(
				() => this.peekCommand("item") || this.peekCommand("end"),
			);
			const labelHtml = label
				? `<span class="item-label">${new Parser(label, this.file).renderInlines()}</span> `
				: "";
			items.push(`<li>${labelHtml}${inner}</li>`);
		}
		const tag = env === "itemize" ? "ul" : "ol";
		return `<${tag}>${items.join("")}</${tag}>`;
	}

	private parseToken(breaks: boolean): string | null {
		const start = this.i;
		if (breaks && this.atBlankBreak()) return null;
		if (this.isSpace()) return this.consumeSpace(breaks);
		if (this.peek("``")) {
			this.i += 2;
			return "“";
		}
		if (this.peek("''")) {
			this.i += 2;
			return "”";
		}
		if (this.peek("---")) {
			this.i += 3;
			return "—";
		}
		if (this.peek("--")) {
			this.i += 2;
			return "–";
		}
		if (
			this.src[this.i] === "-" ||
			this.src[this.i] === "'" ||
			this.src[this.i] === "`"
		) {
			const ch = this.src[this.i] ?? "";
			this.i += 1;
			return escapeHtml(ch);
		}
		if (this.peek("$$")) {
			this.i += 2;
			return renderMath(this.readUntil("$$"), true, this.file);
		}
		if (this.src[this.i] === "$") {
			this.i += 1;
			return renderMath(this.readUntil("$"), false, this.file);
		}
		if (this.src[this.i] === "%") {
			while (this.i < this.src.length && this.src[this.i] !== "\n") this.i++;
			return "";
		}
		if (this.src[this.i] === "~") {
			this.i += 1;
			return "\u00a0";
		}
		if (this.src[this.i] === "\\") return this.parseCommand();
		if ("{}_^&#".includes(this.src[this.i] ?? "")) {
			throw this.fail(`unexpected ${this.src[this.i]}`);
		}
		const plain = this.consumePlain();
		if (this.i === start) throw this.fail("parser made no progress");
		return plain;
	}

	private parseCommand(): string {
		this.i += 1;
		const ch = this.src[this.i];
		if (ch === undefined) throw this.fail("trailing backslash");
		if (!/[a-zA-Z]/.test(ch)) {
			this.i += 1;
			return this.parseControlSymbol(ch);
		}
		const start = this.i;
		while (this.i < this.src.length && /[a-zA-Z]/.test(this.src[this.i] ?? "")) {
			this.i++;
		}
		const name = this.src.slice(start, this.i);
		const wrapper = TEXT_WRAPPERS[name];
		if (wrapper) {
			this.skipSpaceBeforeBrace();
			const inner = this.readBalanced();
			const html = new Parser(inner, this.file).renderInlines();
			return `<${wrapper}>${html}</${wrapper}>`;
		}
		if (name === "url" || name === "href") return this.parseLink(name);
		if (name === "begin") return this.parseBegin();
		throw this.fail(`unknown command \\${name}`);
	}

	private parseLink(name: "url" | "href"): string {
		const url = this.readUrl();
		const label =
			name === "url"
				? escapeHtml(url)
				: new Parser(this.readBalanced(), this.file).renderInlines();
		return `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${label}</a>`;
	}

	private readUrl(): string {
		const url = this.readBalanced().replace(/\s+/g, "");
		let parsed: URL;
		try {
			parsed = new URL(url);
		} catch {
			throw this.fail(`invalid URL`);
		}
		if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
			throw this.fail(`URL must use http or https`);
		}
		return url;
	}

	private parseControlSymbol(ch: string): string {
		if (ch === "(") return renderMath(this.readUntil("\\)"), false, this.file);
		if (ch === "[") return renderMath(this.readUntil("\\]"), true, this.file);
		if (ch === "&") return "&amp;";
		if (ch === "%") return "%";
		if (ch === "$") return "$";
		if (ch === "#") return "#";
		if (ch === "_") return "_";
		if (ch === "{") return "{";
		if (ch === "}") return "}";
		if (ch === " ") return " ";
		throw this.fail(`unknown control symbol \\${ch}`);
	}

	private parseBegin(): string {
		this.skipSpaceBeforeBrace();
		const env = this.readBalanced();
		if (env === "itemize" || env === "enumerate") {
			throw this.fail("list environment inside a paragraph");
		}
		if (!MATH_ENVS.has(env)) throw this.fail(`unknown environment ${env}`);
		const end = `\\end{${env}}`;
		const at = this.src.indexOf(end, this.i);
		if (at < 0) throw this.fail(`unclosed ${env}`);
		const inner = this.src.slice(this.i, at);
		this.i = at + end.length;
		return renderMath(`\\begin{${env}}${inner}\\end{${env}}`, true, this.file);
	}

	private readItemLabel(): string | null {
		const save = this.i;
		this.skipWhitespace();
		if (this.src[this.i] !== "[") {
			this.i = save;
			return null;
		}
		this.i += 1;
		let label = "";
		while (this.i < this.src.length && this.src[this.i] !== "]") {
			label += this.src[this.i];
			this.i += 1;
		}
		if (this.src[this.i] !== "]") throw this.fail("unclosed item label");
		this.i += 1;
		return label;
	}

	private consumeEnd(env: string) {
		const token = `\\end{${env}}`;
		if (!this.src.startsWith(token, this.i)) {
			throw this.fail(`expected ${token}`);
		}
		this.i += token.length;
	}

	private readBalanced(): string {
		this.skipSpaceBeforeBrace();
		if (this.src[this.i] !== "{") throw this.fail("expected {");
		const group = readBraces(this.src, this.i, this.file);
		this.i = group.next;
		return group.inner;
	}

	private readUntil(closer: string): string {
		const start = this.i;
		while (this.i < this.src.length) {
			if (this.src.startsWith(closer, this.i)) {
				const inner = this.src.slice(start, this.i);
				this.i += closer.length;
				return inner;
			}
			if (this.src[this.i] === "\\") {
				this.i += 2;
				continue;
			}
			this.i += 1;
		}
		throw this.fail(`unclosed ${closer}`);
	}

	private consumePlain(): string {
		const start = this.i;
		while (this.i < this.src.length && this.isPlain(this.src[this.i] ?? "")) {
			this.i++;
		}
		return escapeHtml(this.src.slice(start, this.i));
	}

	private consumeSpace(breaks: boolean): string {
		let saw = false;
		while (this.i < this.src.length && this.isSpace()) {
			if (breaks && this.atBlankBreak()) break;
			this.i += 1;
			saw = true;
		}
		if (!saw) throw this.fail("parser made no progress");
		return " ";
	}

	private skipBlankLines() {
		while (/^[ \t]*\n/.test(this.src.slice(this.i))) {
			const match = /^[ \t]*\n/.exec(this.src.slice(this.i));
			if (!match) break;
			this.i += match[0].length;
		}
		if (/^[ \t]*$/.test(this.src.slice(this.i))) this.i = this.src.length;
	}

	private skipWhitespace() {
		while (this.i < this.src.length && /[ \t\n]/.test(this.src[this.i] ?? "")) {
			this.i += 1;
		}
	}

	private skipSpaceBeforeBrace() {
		const save = this.i;
		while (this.i < this.src.length && /[ \t\n]/.test(this.src[this.i] ?? "")) {
			this.i += 1;
		}
		if (this.src[this.i] !== "{") this.i = save;
	}

	private peekListBegin(): "itemize" | "enumerate" | null {
		if (this.src.startsWith("\\begin{itemize}", this.i)) return "itemize";
		if (this.src.startsWith("\\begin{enumerate}", this.i)) return "enumerate";
		return null;
	}

	private peekCommand(name: string): boolean {
		if (!this.src.startsWith(`\\${name}`, this.i)) return false;
		const next = this.src[this.i + name.length + 1];
		return next === undefined || !/[a-zA-Z]/.test(next);
	}

	private peek(text: string): boolean {
		return this.src.startsWith(text, this.i);
	}

	private atBlankBreak(): boolean {
		return /^[ \t]*\n[ \t]*\n/.test(this.src.slice(this.i));
	}

	private isSpace(): boolean {
		const ch = this.src[this.i];
		return ch === " " || ch === "\t" || ch === "\n";
	}

	private isPlain(ch: string): boolean {
		return !/[\s\\$%{}~`'&^_#-]/.test(ch);
	}

	private fail(message: string): Error {
		const around = this.src.slice(this.i, this.i + 48).replaceAll("\n", "\\n");
		return new Error(`${this.file}: ${message} near "${around}"`);
	}
}
