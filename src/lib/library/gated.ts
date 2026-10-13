import {
	catalog,
	type Entry,
	entryPath,
	KINDS,
	recallEntries,
	topicRecallEntries,
} from "./load";
import { type RecallCard, recallCard } from "./recall";

export type GatedBlock = {
	id: string;
	label: "Solution" | "Proof";
	html: string;
};

const solutions = new Map<string, GatedBlock[]>();
const quizzes = new Map<string, RecallCard[]>();

function addSolutions(path: string, blocks: GatedBlock[]) {
	if (blocks.length > 0) solutions.set(path, blocks);
}

function blocksFor(
	entries: Entry[],
	field: "solutionHtml" | "proofHtml",
	label: GatedBlock["label"],
): GatedBlock[] {
	return entries.flatMap((entry) => {
		const html = entry[field];
		if (!html) return [];
		return [{ id: entry.slug, label, html }];
	});
}

function problemBlocks(entry: Entry): GatedBlock[] {
	if (entry.inlineProblems) {
		return entry.inlineProblems.flatMap((item, index) =>
			item.solutionHtml
				? [
						{
							id: String(index),
							label: "Solution" as const,
							html: item.solutionHtml,
						},
					]
				: [],
		);
	}
	if (!entry.solutionHtml) return [];
	return [{ id: entry.slug, label: "Solution", html: entry.solutionHtml }];
}

for (const topic of catalog.topics) {
	const topicCards = topicRecallEntries(topic).map(recallCard);
	if (topicCards.length > 0) quizzes.set(`/${topic.slug}/quiz`, topicCards);

	for (const subtopic of topic.subtopics) {
		if (subtopic.slug === "quiz") continue;
		const cards = recallEntries(subtopic).map(recallCard);
		if (cards.length > 0) {
			quizzes.set(`/${topic.slug}/${subtopic.slug}/quiz`, cards);
		}
		const base = `/${topic.slug}/${subtopic.slug}`;
		addSolutions(
			`${base}/definitions`,
			blocksFor(subtopic.kinds.definitions, "solutionHtml", "Solution"),
		);
		addSolutions(
			`${base}/techniques`,
			blocksFor(subtopic.kinds.techniques, "solutionHtml", "Solution"),
		);
		addSolutions(
			`${base}/theorems`,
			blocksFor(subtopic.kinds.theorems, "proofHtml", "Proof"),
		);
		for (const entry of subtopic.kinds.problems) {
			addSolutions(`${base}/problems/${entry.slug}`, problemBlocks(entry));
		}
	}
}

export function solutionsFor(page: string): GatedBlock[] | undefined {
	return solutions.get(normalizePage(page));
}

export function cardsFor(page: string): RecallCard[] | undefined {
	return quizzes.get(normalizePage(page));
}

function normalizePage(page: string): string {
	const path = page.split("#")[0]?.split("?")[0] ?? "";
	if (!path.startsWith("/") || path.includes("..") || path.includes("//")) {
		return "";
	}
	if (path.length > 1 && path.endsWith("/")) return path.slice(0, -1);
	return path;
}

export function kindPaths(kind: "definitions" | "techniques" | "theorems") {
	return catalog.topics.flatMap((topic) =>
		topic.subtopics
			.filter(
				(subtopic) =>
					subtopic.slug !== "quiz" && subtopic.kinds[kind].length > 0,
			)
			.map((subtopic) => ({
				params: { topic: topic.slug, subtopic: subtopic.slug },
			})),
	);
}

export function topicQuizPaths() {
	return catalog.topics
		.filter((topic) => topicRecallEntries(topic).length > 0)
		.map((topic) => ({ params: { topic: topic.slug } }));
}

export function subtopicQuizPaths() {
	return catalog.topics.flatMap((topic) =>
		topic.subtopics
			.filter(
				(subtopic) =>
					subtopic.slug !== "quiz" && recallEntries(subtopic).length > 0,
			)
			.map((subtopic) => ({
				params: { topic: topic.slug, subtopic: subtopic.slug },
			})),
	);
}

const REDIRECT_KINDS = new Set(["definitions", "techniques", "theorems"]);

export function entryPaths() {
	const paths: {
		params: { topic: string; subtopic: string; kind: string; slug: string };
		props: { redirectTo?: string };
	}[] = [];
	for (const topic of catalog.topics) {
		for (const subtopic of topic.subtopics) {
			if (subtopic.slug === "quiz") continue;
			for (const kind of KINDS) {
				for (const entry of subtopic.kinds[kind.id]) {
					paths.push({
						params: {
							topic: topic.slug,
							subtopic: subtopic.slug,
							kind: kind.id,
							slug: entry.slug,
						},
						props: REDIRECT_KINDS.has(kind.id)
							? { redirectTo: entryPath(entry) }
							: {},
					});
				}
			}
		}
	}
	return paths;
}

export function legacyPaths() {
	const seen = new Set<string>();
	const paths: {
		params: { topic: string; kind: string; slug: string };
		props: { redirectTo: string };
	}[] = [];
	for (const topic of catalog.topics) {
		for (const subtopic of topic.subtopics) {
			for (const kind of KINDS) {
				for (const entry of subtopic.kinds[kind.id]) {
					const key = `${topic.slug}/${kind.id}/${entry.slug}`;
					if (seen.has(key)) continue;
					seen.add(key);
					paths.push({
						params: {
							topic: topic.slug,
							kind: kind.id,
							slug: entry.slug,
						},
						props: { redirectTo: entryPath(entry) },
					});
				}
			}
		}
	}
	return paths;
}
