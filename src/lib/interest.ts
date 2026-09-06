import { env } from 'cloudflare:workers';

export async function getInterestCount(): Promise<number> {
	const row = await env.DB.prepare(
		'SELECT COUNT(*) AS count FROM interests',
	).first<{ count: number }>();
	return row?.count ?? 0;
}

export async function hasInterest(clerkUserId: string): Promise<boolean> {
	const row = await env.DB.prepare(
		'SELECT 1 AS found FROM interests WHERE clerk_user_id = ?',
	)
		.bind(clerkUserId)
		.first();
	return row != null;
}

export async function addInterest(
	clerkUserId: string,
	email: string | null,
): Promise<void> {
	await env.DB.prepare(
		'INSERT OR IGNORE INTO interests (clerk_user_id, email, created_at) VALUES (?, ?, ?)',
	)
		.bind(clerkUserId, email, new Date().toISOString())
		.run();
}

export async function removeInterest(clerkUserId: string): Promise<void> {
	await env.DB.prepare('DELETE FROM interests WHERE clerk_user_id = ?')
		.bind(clerkUserId)
		.run();
}

export async function toggleInterest(
	clerkUserId: string,
	email: string | null,
): Promise<boolean> {
	if (await hasInterest(clerkUserId)) {
		await removeInterest(clerkUserId);
		return false;
	}
	await addInterest(clerkUserId, email);
	return true;
}

export function primaryEmail(
	user: { primaryEmailAddress?: { emailAddress: string } | null } | null,
): string | null {
	return user?.primaryEmailAddress?.emailAddress ?? null;
}
