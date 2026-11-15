import type { APIRoute } from "astro";

import { quizPage } from "../../lib/library/gated";
import { finishQuizStart, isQuizDifficulty, recordQuizStart } from "../../lib/quiz-start";

export const POST: APIRoute = async ({ request, locals }) => {
	const { isAuthenticated, userId } = locals.auth();
	if (!isAuthenticated || !userId) {
		return new Response("Unauthorized", { status: 401 });
	}

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return new Response("Bad request", { status: 400 });
	}
	const fields = record(body);
	const page = fields?.page;
	const difficulty = fields?.difficulty;
	if (typeof page !== "string" || !isQuizDifficulty(difficulty)) {
		return new Response("Bad request", { status: 400 });
	}
	const quiz = quizPage(page);
	if (!quiz) return new Response("Not found", { status: 404 });

	const start = await recordQuizStart(quiz, difficulty);
	return json(start, 201);
};

export const PATCH: APIRoute = async ({ request, locals }) => {
	const { isAuthenticated, userId } = locals.auth();
	if (!isAuthenticated || !userId) {
		return new Response("Unauthorized", { status: 401 });
	}

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return new Response("Bad request", { status: 400 });
	}
	const fields = record(body);
	const id = fields?.id;
	const token = fields?.token;
	const score = fields?.score;
	if (!isId(id) || !isToken(token) || !isScore(score)) {
		return new Response("Bad request", { status: 400 });
	}
	const updated = await finishQuizStart(id, token, score);
	if (!updated) return new Response("Not found", { status: 404 });
	return new Response(null, { status: 204 });
};

function record(value: unknown):
	| {
			page?: unknown;
			difficulty?: unknown;
			id?: unknown;
			token?: unknown;
			score?: unknown;
	  }
	| undefined {
	if (value === null || typeof value !== "object" || Array.isArray(value)) {
		return undefined;
	}
	return value;
}

function isId(value: unknown): value is number {
	return typeof value === "number" && Number.isInteger(value) && value > 0;
}

function isToken(value: unknown): value is string {
	return (
		typeof value === "string" &&
		/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
	);
}

function isScore(value: unknown): value is string {
	return typeof value === "string" && value.length > 0 && value.length <= 32;
}

function json(body: unknown, status = 200) {
	return new Response(JSON.stringify(body), {
		status,
		headers: { "content-type": "application/json" },
	});
}
