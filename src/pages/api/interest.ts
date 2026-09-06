import type { APIRoute } from 'astro';
import { primaryEmail, toggleInterest } from '../../lib/interest';

export const POST: APIRoute = async ({ locals, redirect }) => {
	const { isAuthenticated, userId } = locals.auth();
	if (!isAuthenticated || !userId) {
		return new Response('Unauthorized', { status: 401 });
	}

	const user = await locals.currentUser();
	await toggleInterest(userId, primaryEmail(user));
	return redirect('/', 303);
};
