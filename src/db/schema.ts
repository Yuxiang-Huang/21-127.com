import { sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const interests = sqliteTable('interests', {
	clerkUserId: text('clerk_user_id').primaryKey(),
	email: text('email'),
	createdAt: text('created_at').notNull(),
});
