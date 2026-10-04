import { parse } from "yaml";
import { parseQuestion, type Question } from "./atoms";
import { renderTex } from "./render";

export type { Question };

export const KINDS = [
	{ id: "definitions", label: "Definitions" },
	{ id: "techniques", label: "Techniques" },
	{ id: "theorems", label: "Theorems" },
	{ id: "problems", label: "Problems" },
] as const;

export type Kind = (typeof KINDS)[number]["id"];

export type Entry = {
	topic: string;
	subtopic: string;
	kind: Kind;
	slug: string;
	title: string;
	html: string;
	solutionHtml: string | null;
	proofHtml: string | null;
	inlineProblems: { promptHtml: string; solutionHtml: string }[] | null;
	question: Question | null;
};

export type Subtopic = {
	slug: string;
	title: string;
	kinds: Record<Kind, Entry[]>;
};

export type Topic = {
	slug: string;
	title: string;
	subtopics: Subtopic[];
};

export type Catalog = {
	topics: Topic[];
};

export type SourceFile = {
	path: string;
	text: string;
};

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function isKind(value: string): value is Kind {
	return KINDS.some((kind) => kind.id === value);
}

export function entryPath(entry: Entry): string {
	if (
		entry.kind === "definitions" ||
		entry.kind === "techniques" ||
		entry.kind === "theorems"
	) {
		return `/${entry.topic}/${entry.subtopic}/${entry.kind}#${entry.slug}`;
	}
	return `/${entry.topic}/${entry.subtopic}/${entry.kind}/${entry.slug}`;
}

export function subtopicPath(topicSlug: string, subtopic: Subtopic): string {
	if (subtopic.slug === "quiz") return `/${topicSlug}/quiz`;
	const first = firstEntry(subtopic);
	if (first.kind === "definitions" || first.kind === "techniques") {
		return `/${first.topic}/${first.subtopic}/${first.kind}`;
	}
	return entryPath(first);
}

const RECALL: Kind[] = ["definitions", "techniques", "theorems"];

export function recallEntries(subtopic: Subtopic): Entry[] {
	return RECALL.flatMap((kind) => subtopic.kinds[kind]).filter(
		(entry) => entry.question !== null,
	);
}

export function topicRecallEntries(topic: Topic): Entry[] {
	return topic.subtopics.flatMap(recallEntries);
}

export function getSubtopic(
	catalog: Catalog,
	topicSlug: string,
	subtopicSlug: string,
): { topic: Topic; subtopic: Subtopic } | undefined {
	const topic = catalog.topics.find((item) => item.slug === topicSlug);
	if (!topic) return undefined;
	const subtopic = topic.subtopics.find((item) => item.slug === subtopicSlug);
	if (!subtopic) return undefined;
	return { topic, subtopic };
}

export function firstEntry(subtopic: Subtopic): Entry {
	for (const kind of KINDS) {
		const entry = subtopic.kinds[kind.id][0];
		if (entry) return entry;
	}
	throw new Error(`${subtopic.slug} has no entries`);
}

export function getEntry(
	catalog: Catalog,
	topicSlug: string,
	subtopicSlug: string,
	kind: string,
	slug: string,
): { topic: Topic; subtopic: Subtopic; entry: Entry } | undefined {
	const topic = catalog.topics.find((item) => item.slug === topicSlug);
	if (!topic || !isKind(kind)) return undefined;
	const subtopic = topic.subtopics.find((item) => item.slug === subtopicSlug);
	if (!subtopic) return undefined;
	const entry = subtopic.kinds[kind].find((item) => item.slug === slug);
	if (!entry) return undefined;
	return { topic, subtopic, entry };
}

export function findEntry(
	catalog: Catalog,
	topicSlug: string,
	kind: string,
	slug: string,
): Entry | undefined {
	const topic = catalog.topics.find((item) => item.slug === topicSlug);
	if (!topic || !isKind(kind)) return undefined;
	for (const subtopic of topic.subtopics) {
		const entry = subtopic.kinds[kind].find((item) => item.slug === slug);
		if (entry) return entry;
	}
	return undefined;
}

export function assembleCatalog(files: SourceFile[]): Catalog {
	const tex = new Map<string, string>();
	const yaml = new Map<string, string>();
	for (const file of files) {
		if (file.path.endsWith(".tex")) tex.set(file.path, file.text);
		else if (file.path.endsWith(".yaml")) yaml.set(file.path, file.text);
		else throw new Error(`unexpected library file ${file.path}`);
	}

	const topicsFile = yaml.get("topics.yaml");
	if (topicsFile === undefined) throw new Error("missing topics.yaml");
	const topicSlugs = readTopicIndex(topicsFile);

	const topics: Topic[] = [];
	const usedTex = new Set<string>();
	const usedYaml = new Set<string>(["topics.yaml"]);

	for (const slug of topicSlugs) {
		const yamlPath = `${slug}/topic.yaml`;
		const topicFile = yaml.get(yamlPath);
		if (topicFile === undefined) throw new Error(`missing ${yamlPath}`);
		usedYaml.add(yamlPath);
		topics.push(readTopic(slug, topicFile, tex, yaml, usedTex, usedYaml));
	}

	for (const path of yaml.keys()) {
		if (!usedYaml.has(path)) {
			throw new Error(`yaml file not listed in topics.yaml: ${path}`);
		}
	}
	for (const path of tex.keys()) {
		if (path === "preamble.tex" || path === "introduction.tex") continue;
		if (!usedTex.has(path)) {
			throw new Error(`tex file not listed in topic.yaml: ${path}`);
		}
	}

	return { topics };
}

function readTopicIndex(text: string): string[] {
	const doc = asRecord(parse(text), "topics.yaml");
	const topics = doc.topics;
	if (!Array.isArray(topics) || topics.length === 0) {
		throw new Error("topics.yaml: topics must be a non-empty list of slugs");
	}
	const slugs: string[] = [];
	for (const topic of topics) {
		if (typeof topic !== "string" || !SLUG.test(topic)) {
			throw new Error("topics.yaml: topics must be a non-empty list of slugs");
		}
		slugs.push(topic);
	}
	if (new Set(slugs).size !== slugs.length) {
		throw new Error("topics.yaml: duplicate topic slug");
	}
	const extra = Object.keys(doc).filter((key) => key !== "topics");
	if (extra.length > 0) {
		throw new Error(`topics.yaml: unknown keys ${extra.join(", ")}`);
	}
	return slugs;
}

function readTopic(
	slug: string,
	text: string,
	tex: Map<string, string>,
	yaml: Map<string, string>,
	usedTex: Set<string>,
	usedYaml: Set<string>,
): Topic {
	const file = `${slug}/topic.yaml`;
	const doc = asRecord(parse(text), file);
	const title = doc.title;
	if (typeof title !== "string" || title.trim() === "") {
		throw new Error(`${file}: title must be a non-empty string`);
	}
	const extra = Object.keys(doc).filter(
		(key) => key !== "title" && key !== "subtopics",
	);
	if (extra.length > 0) {
		throw new Error(`${file}: unknown keys ${extra.join(", ")}`);
	}
	if (!Array.isArray(doc.subtopics) || doc.subtopics.length === 0) {
		throw new Error(`${file}: subtopics must be a non-empty list`);
	}

	const seenSubtopics = new Set<string>();
	const seenInKind = Object.fromEntries(
		KINDS.map((kind) => [kind.id, new Set<string>()]),
	) as Record<Kind, Set<string>>;

	const subtopics = doc.subtopics.map((item, index) =>
		readSubtopic(
			slug,
			file,
			index,
			item,
			tex,
			yaml,
			usedTex,
			usedYaml,
			seenSubtopics,
			seenInKind,
		),
	);
	if (seenSubtopics.has("quiz")) {
		throw new Error(`${file}: quiz is reserved`);
	}
	subtopics.push({
		slug: "quiz",
		title: "Quiz",
		kinds: { definitions: [], techniques: [], theorems: [], problems: [] },
	});

	return { slug, title: title.trim(), subtopics };
}

function readSubtopic(
	topicSlug: string,
	file: string,
	index: number,
	value: unknown,
	tex: Map<string, string>,
	yaml: Map<string, string>,
	usedTex: Set<string>,
	usedYaml: Set<string>,
	seenSubtopics: Set<string>,
	seenInKind: Record<Kind, Set<string>>,
): Subtopic {
	const where = `${file}: subtopics[${index}]`;
	const doc = asRecord(value, where);
	const slug = doc.slug;
	if (typeof slug !== "string" || !SLUG.test(slug)) {
		throw new Error(`${where}: slug must be a slug`);
	}
	if (seenSubtopics.has(slug)) {
		throw new Error(`${file}: duplicate subtopic slug ${slug}`);
	}
	seenSubtopics.add(slug);
	const title = doc.title;
	if (typeof title !== "string" || title.trim() === "") {
		throw new Error(`${where}: title must be a non-empty string`);
	}
	const extra = Object.keys(doc).filter(
		(key) => key !== "slug" && key !== "title" && !isKind(key),
	);
	if (extra.length > 0) {
		throw new Error(`${where}: unknown keys ${extra.join(", ")}`);
	}

	const kinds = {} as Record<Kind, Entry[]>;
	for (const kind of KINDS) {
		kinds[kind.id] = readKindList(
			topicSlug,
			slug,
			kind.id,
			doc[kind.id],
			`${where}: ${kind.id}`,
			file,
			tex,
			yaml,
			usedTex,
			usedYaml,
			seenInKind[kind.id],
		);
	}

	return { slug, title: title.trim(), kinds };
}

function readKindList(
	topicSlug: string,
	subtopicSlug: string,
	kind: Kind,
	value: unknown,
	where: string,
	file: string,
	tex: Map<string, string>,
	yaml: Map<string, string>,
	usedTex: Set<string>,
	usedYaml: Set<string>,
	seen: Set<string>,
): Entry[] {
	if (!Array.isArray(value)) {
		throw new Error(`${where} must be a list of slugs`);
	}
	return value.map((entrySlug) => {
		if (typeof entrySlug !== "string" || !SLUG.test(entrySlug)) {
			throw new Error(`${where}: invalid slug`);
		}
		if (seen.has(entrySlug)) {
			throw new Error(`${file}: duplicate slug ${entrySlug} in ${kind}`);
		}
		seen.add(entrySlug);
		const texPath = `${topicSlug}/${kind}/${entrySlug}.tex`;
		const source = tex.get(texPath);
		if (source === undefined) {
			throw new Error(`${file}: missing tex file ${texPath}`);
		}
		usedTex.add(texPath);
		const rendered = renderTex(source, texPath);
		const question =
			kind === "problems"
				? null
				: readQuestion(topicSlug, kind, entrySlug, file, yaml, usedYaml);
		return {
			topic: topicSlug,
			subtopic: subtopicSlug,
			kind,
			slug: entrySlug,
			title: rendered.title,
			html: rendered.html,
			solutionHtml: rendered.solutionHtml,
			proofHtml: rendered.proofHtml,
			inlineProblems: rendered.inlineProblems,
			question,
		};
	});
}

function readQuestion(
	topicSlug: string,
	kind: Kind,
	slug: string,
	file: string,
	yaml: Map<string, string>,
	usedYaml: Set<string>,
): Question {
	const yamlPath = `${topicSlug}/${kind}/${slug}.yaml`;
	const source = yaml.get(yamlPath);
	if (source === undefined) {
		throw new Error(`${file}: missing question file ${yamlPath}`);
	}
	usedYaml.add(yamlPath);
	return parseQuestion(source, yamlPath);
}

function asRecord(value: unknown, file: string): Record<string, unknown> {
	if (value === null || typeof value !== "object" || Array.isArray(value)) {
		throw new Error(`${file}: expected a mapping`);
	}
	return value as Record<string, unknown>;
}
