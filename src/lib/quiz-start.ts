import { and, eq } from "drizzle-orm";

import { db, quizStarts } from "../db";

const DIFFICULTIES = ["easy", "medium", "hard", "mastery", "yuxiang"] as const;

export type QuizDifficulty = (typeof DIFFICULTIES)[number];

export function isQuizDifficulty(value: unknown): value is QuizDifficulty {
	return typeof value === "string" && (DIFFICULTIES as readonly string[]).includes(value);
}

export async function recordQuizStart(
	clerkUserId: string,
	email: string | null,
	page: string,
	difficulty: QuizDifficulty,
): Promise<number> {
	const [row] = await db()
		.insert(quizStarts)
		.values({
			clerkUserId,
			email,
			page,
			difficulty,
			startedAt: new Date().toISOString(),
			finished: false,
		})
		.returning({ id: quizStarts.id });
	if (!row) throw new Error("quiz start was not recorded");
	return row.id;
}

export async function finishQuizStart(
	clerkUserId: string,
	id: number,
	score: string,
): Promise<boolean> {
	const rows = await db()
		.update(quizStarts)
		.set({ score, finished: true })
		.where(and(eq(quizStarts.id, id), eq(quizStarts.clerkUserId, clerkUserId)))
		.returning({ id: quizStarts.id });
	return rows.length > 0;
}
