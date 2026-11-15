import { and, eq } from "drizzle-orm";

import { db, quizStarts } from "../db";

const DIFFICULTIES = ["easy", "medium", "hard", "mastery", "yuxiang"] as const;

export type QuizDifficulty = (typeof DIFFICULTIES)[number];

export function isQuizDifficulty(value: unknown): value is QuizDifficulty {
	return typeof value === "string" && (DIFFICULTIES as readonly string[]).includes(value);
}

export async function recordQuizStart(
	page: string,
	difficulty: QuizDifficulty,
): Promise<{ id: number; token: string }> {
	const token = crypto.randomUUID();
	const [row] = await db()
		.insert(quizStarts)
		.values({
			page,
			difficulty,
			startedAt: new Date().toISOString(),
			finished: false,
			token,
		})
		.returning({ id: quizStarts.id });
	if (!row) throw new Error("quiz start was not recorded");
	return { id: row.id, token };
}

export async function finishQuizStart(id: number, token: string, score: string): Promise<boolean> {
	const rows = await db()
		.update(quizStarts)
		.set({ score, finished: true })
		.where(and(eq(quizStarts.id, id), eq(quizStarts.token, token)))
		.returning({ id: quizStarts.id });
	return rows.length > 0;
}
