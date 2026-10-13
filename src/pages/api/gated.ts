import type { APIRoute } from "astro";
import { cardsFor, solutionsFor } from "../../lib/library/gated";

export const GET: APIRoute = ({ locals, url }) => {
	const { isAuthenticated, userId } = locals.auth();
	if (!isAuthenticated || !userId) {
		return new Response("Unauthorized", { status: 401 });
	}
	const page = url.searchParams.get("page");
	if (!page) return new Response("Bad request", { status: 400 });
	const solutions = solutionsFor(page) ?? [];
	const cards = cardsFor(page) ?? [];
	if (solutions.length === 0 && cards.length === 0) {
		return new Response("Not found", { status: 404 });
	}
	return new Response(JSON.stringify({ solutions, cards }), {
		headers: {
			"content-type": "application/json",
			"cache-control": "private, no-store",
		},
	});
};
