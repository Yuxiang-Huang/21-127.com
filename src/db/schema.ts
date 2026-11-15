import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const interests = sqliteTable("interests", {
	clerkUserId: text("clerk_user_id").primaryKey(),
	email: text("email"),
	createdAt: text("created_at").notNull(),
});

export const quizStarts = sqliteTable("quiz_starts", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	clerkUserId: text("clerk_user_id").notNull(),
	email: text("email"),
	page: text("page").notNull(),
	difficulty: text("difficulty").notNull(),
	startedAt: text("started_at").notNull(),
	score: text("score"),
	finished: integer("finished", { mode: "boolean" }).notNull().default(false),
});
