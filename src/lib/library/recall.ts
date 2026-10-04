import type { Entry } from "./catalog";
import { renderFragment } from "./render";

export type RecallChoice = {
	text: string;
	html: string;
};

export type RecallPart = {
	text: string;
	html: string;
	wrong: RecallChoice[] | null;
};

export type RecallCard = {
	topic: string;
	kind: string;
	slug: string;
	title: string;
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
		parts: question.parts.map((text, index) => {
			const atom = question.atoms.find((item) => item.index === index);
			return {
				text,
				html: renderFragment(text),
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

export function hideCount(count: number, rate: number): number {
	if (count === 0) return 0;
	if (rate >= 1) return count;
	return Math.min(count, Math.max(1, Math.round(count * rate)));
}
