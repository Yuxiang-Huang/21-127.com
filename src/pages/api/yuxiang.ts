import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { catalog, findEntry, isKind } from "../../lib/library/load";
import { cosineSimilarity } from "../../lib/library/similarity";

export const POST: APIRoute = async ({ request }) => {
	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return json({ error: "Type the LaTeX before checking." }, 400);
	}
	const record = asRecord(body);
	const topic = record?.topic;
	const kind = record?.kind;
	const slug = record?.slug;
	const input = record?.input;
	if (
		typeof topic !== "string" ||
		typeof kind !== "string" ||
		typeof slug !== "string" ||
		typeof input !== "string"
	) {
		return json({ error: "Type the LaTeX before checking." }, 400);
	}
	if (input.trim() === "") {
		return json({ error: "Type the LaTeX before checking." }, 400);
	}
	if (!isKind(kind)) return json({ error: "That question was not found." }, 404);
	const entry = findEntry(catalog, topic, kind, slug);
	const statement = entry?.question?.statement;
	if (!statement) return json({ error: "That question was not found." }, 404);

	const key = openRouterKey();
	if (!key) return json({ error: "Yuxiang is unavailable." }, 500);

	let response: Response;
	try {
		response = await fetch("https://openrouter.ai/api/v1/embeddings", {
			method: "POST",
			headers: {
				Authorization: `Bearer ${key}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				model: "openai/text-embedding-3-small",
				input: [input, statement],
			}),
		});
	} catch {
		return json({ error: "Yuxiang is unavailable." }, 502);
	}
	if (!response.ok) return json({ error: "Yuxiang is unavailable." }, 502);

	let payload: unknown;
	try {
		payload = await response.json();
	} catch {
		return json({ error: "Yuxiang is unavailable." }, 502);
	}
	const vectors = embeddings(payload);
	if (!vectors) return json({ error: "Yuxiang is unavailable." }, 502);

	try {
		return json({ similarity: cosineSimilarity(vectors[0], vectors[1]) });
	} catch {
		return json({ error: "Yuxiang is unavailable." }, 502);
	}
};

function openRouterKey(): string | undefined {
	const fromWorker = env.OPENROUTER_API_KEY;
	if (typeof fromWorker === "string" && fromWorker !== "") return fromWorker;
	const fromFile = import.meta.env.OPENROUTER_API_KEY;
	return typeof fromFile === "string" && fromFile !== "" ? fromFile : undefined;
}

function embeddings(payload: unknown): [number[], number[]] | undefined {
	const data = asRecord(payload)?.data;
	if (!Array.isArray(data)) return undefined;
	const vectors = data.flatMap((item) => {
		const embedding = asRecord(item)?.embedding;
		const index = asRecord(item)?.index;
		if (!Array.isArray(embedding) || typeof index !== "number") return [];
		if (!embedding.every((value) => typeof value === "number")) return [];
		return [{ index, embedding: embedding as number[] }];
	});
	vectors.sort((left, right) => left.index - right.index);
	if (vectors.length !== 2) return undefined;
	return [vectors[0].embedding, vectors[1].embedding];
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
	if (value === null || typeof value !== "object" || Array.isArray(value)) {
		return undefined;
	}
	return value as Record<string, unknown>;
}

function json(body: unknown, status = 200) {
	return new Response(JSON.stringify(body), {
		status,
		headers: { "content-type": "application/json" },
	});
}
