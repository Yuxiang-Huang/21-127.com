import type { Entry } from "./catalog";
import { renderFragment } from "./render";

export type RecallChoice = {
	text: string;
	html: string;
};

export type RecallPiece =
	| { kind: "text"; html: string }
	| { kind: "list" }
	| { kind: "item" }
	| { kind: "list-end" };

export type RecallPart = {
	text: string;
	html: string;
	pieces: RecallPiece[];
	wrong: RecallChoice[] | null;
};

export type RecallCard = {
	topic: string;
	kind: string;
	slug: string;
	title: string;
	quizTitle: string;
	parts: RecallPart[];
};

export function recallCard(entry: Entry): RecallCard {
	const question = entry.question;
	if (!question) throw new Error(`${entry.slug} has no question`);
	return {
		topic: entry.topic,
		kind: entry.kind,
		slug: entry.slug,
		title: entry.title,
		quizTitle: question.title ?? entry.title,
		parts: question.parts.map((text, index) => {
			const atom = question.atoms.find((item) => item.index === index);
			return {
				text,
				html: renderFragment(atomText(text)),
				pieces: questionPieces(text),
				wrong: atom
					? atom.wrong.map((choice) => ({
							text: choice,
							html: renderFragment(choice),
						}))
					: null,
			};
		}),
	};
}

export type { ClozePick } from "./cloze";
export { clozeMarks, hideCount } from "./cloze";

const LIST_TOKENS = [
	["\\begin{itemize}", "list"],
	["\\end{itemize}", "list-end"],
	["\\item", "item"],
] as const;

export function questionPieces(source: string): RecallPiece[] {
	if (source !== "" && source.trim() === "") {
		return [{ kind: "text", html: " " }];
	}
	const pieces: RecallPiece[] = [];
	let i = 0;
	while (i < source.length) {
		const token = nextListToken(source, i);
		const raw = token ? source.slice(i, token.at) : source.slice(i);
		const text = token ? raw.trimEnd() : raw;
		if (text.trim() !== "")
			pieces.push({ kind: "text", html: renderQuestionText(text) });
		if (!token) break;
		pieces.push({ kind: token.kind });
		i = token.at + token.length;
		while (source[i] === " " || source[i] === "\n" || source[i] === "\t") i++;
	}
	return pieces;
}

function nextListToken(
	source: string,
	from: number,
): { at: number; length: number; kind: "list" | "item" | "list-end" } | null {
	let found: {
		at: number;
		length: number;
		kind: "list" | "item" | "list-end";
	} | null = null;
	for (const [token, kind] of LIST_TOKENS) {
		const at = source.indexOf(token, from);
		if (at < 0) continue;
		if (!found || at < found.at) found = { at, length: token.length, kind };
	}
	return found;
}

function renderQuestionText(source: string): string {
	let html = "";
	let i = 0;
	const marker = "\\textbf{";
	while (i < source.length) {
		const at = source.indexOf(marker, i);
		const chunk = at < 0 ? source.slice(i) : source.slice(i, at);
		html += renderFragment(chunk);
		if (at < 0) break;
		const end = source.indexOf("}", at + marker.length);
		if (end < 0) {
			html += renderFragment(source.slice(at));
			break;
		}
		html += `<strong>${renderFragment(source.slice(at + marker.length, end))}</strong>`;
		i = end + 1;
	}
	return html;
}

function atomText(text: string): string {
	return text
		.replaceAll("\\begin{itemize}", "")
		.replaceAll("\\end{itemize}", "")
		.replaceAll("\\item", "")
		.replaceAll(/\\textbf\{([^{}]*)\}/g, "$1");
}
