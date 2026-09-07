import { eq } from 'drizzle-orm';
import { db, interests } from '../db';

export async function getInterestCount(): Promise<number> {
	return db().$count(interests);
}

export async function hasInterest(clerkUserId: string): Promise<boolean> {
	const [row] = await db()
		.select({ clerkUserId: interests.clerkUserId })
		.from(interests)
		.where(eq(interests.clerkUserId, clerkUserId))
		.limit(1);
	return row != null;
}

export async function addInterest(
	clerkUserId: string,
	email: string | null,
): Promise<void> {
	await db()
		.insert(interests)
		.values({
			clerkUserId,
			email,
			createdAt: new Date().toISOString(),
		})
		.onConflictDoNothing();
}

export async function removeInterest(clerkUserId: string): Promise<void> {
	await db().delete(interests).where(eq(interests.clerkUserId, clerkUserId));
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
