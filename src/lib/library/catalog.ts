import { parse } from "yaml";
import { renderTex } from "./render";

export const KINDS = [
	{ id: "definitions", label: "Definitions" },
	{ id: "techniques", label: "Techniques" },
	{ id: "theorems", label: "Theorems" },
	{ id: "problems", label: "Problems" },
] as const;

export type Kind = (typeof KINDS)[number]["id"];

export type Entry = {
	topic: string;
	kind: Kind;
	slug: string;
	title: string;
	html: string;
	solutionHtml: string | null;
};

export type Topic = {
	slug: string;
	title: string;
	kinds: Record<Kind, Entry[]>;
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

export function firstEntry(topic: Topic): Entry {
	for (const kind of KINDS) {
		const entry = topic.kinds[kind.id][0];
		if (entry) return entry;
	}
	throw new Error(`${topic.slug} has no entries`);
}

export function getEntry(
	catalog: Catalog,
	topicSlug: string,
	kind: string,
	slug: string,
): { topic: Topic; entry: Entry } | undefined {
	const topic = catalog.topics.find((item) => item.slug === topicSlug);
	if (!topic || !isKind(kind)) return undefined;
	const entry = topic.kinds[kind].find((item) => item.slug === slug);
	if (!entry) return undefined;
	return { topic, entry };
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
		topics.push(readTopic(slug, topicFile, tex, usedTex));
	}

	for (const path of yaml.keys()) {
		if (!usedYaml.has(path)) {
			throw new Error(`yaml file not listed in topics.yaml: ${path}`);
		}
	}
	for (const path of tex.keys()) {
		if (path === "preamble.tex") continue;
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
	usedTex: Set<string>,
): Topic {
	const file = `${slug}/topic.yaml`;
	const doc = asRecord(parse(text), file);
	const title = doc.title;
	if (typeof title !== "string" || title.trim() === "") {
		throw new Error(`${file}: title must be a non-empty string`);
	}
	const extra = Object.keys(doc).filter(
		(key) => key !== "title" && !isKind(key),
	);
	if (extra.length > 0) {
		throw new Error(`${file}: unknown keys ${extra.join(", ")}`);
	}

	const kinds = {} as Record<Kind, Entry[]>;
	for (const kind of KINDS) {
		const list = doc[kind.id];
		if (!Array.isArray(list)) {
			throw new Error(`${file}: ${kind.id} must be a list of slugs`);
		}
		const seen = new Set<string>();
		kinds[kind.id] = list.map((entrySlug) => {
			if (typeof entrySlug !== "string" || !SLUG.test(entrySlug)) {
				throw new Error(`${file}: invalid slug in ${kind.id}`);
			}
			if (seen.has(entrySlug)) {
				throw new Error(`${file}: duplicate slug ${entrySlug}`);
			}
			seen.add(entrySlug);
			const texPath = `${slug}/${kind.id}/${entrySlug}.tex`;
			const source = tex.get(texPath);
			if (source === undefined) {
				throw new Error(`${file}: missing tex file ${texPath}`);
			}
			usedTex.add(texPath);
			const rendered = renderTex(source, texPath);
			return {
				topic: slug,
				kind: kind.id,
				slug: entrySlug,
				title: rendered.title,
				html: rendered.html,
				solutionHtml: rendered.solutionHtml,
			};
		});
	}

	return { slug, title: title.trim(), kinds };
}

function asRecord(value: unknown, file: string): Record<string, unknown> {
	if (value === null || typeof value !== "object" || Array.isArray(value)) {
		throw new Error(`${file}: expected a mapping`);
	}
	return value as Record<string, unknown>;
}
