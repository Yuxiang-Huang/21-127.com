import type { APIRoute } from "astro";
import {
	getInterestCount,
	hasInterest,
	primaryEmail,
	toggleInterest,
} from "../../lib/interest";

export const GET: APIRoute = async ({ locals }) => {
	const count = await getInterestCount();
	const { isAuthenticated, userId } = locals.auth();
	const signedIn = Boolean(isAuthenticated && userId);
	const interested = signedIn && userId ? await hasInterest(userId) : false;
	return new Response(JSON.stringify({ count, signedIn, interested }), {
		headers: {
			"content-type": "application/json",
			"cache-control": "private, no-store",
		},
	});
};

export const POST: APIRoute = async ({ locals, redirect }) => {
	const { isAuthenticated, userId } = locals.auth();
	if (!isAuthenticated || !userId) {
		return new Response("Unauthorized", { status: 401 });
	}

	const user = await locals.currentUser();
	await toggleInterest(userId, primaryEmail(user));
	return redirect("/", 303);
};
