-- A score row names the quiz, not the User. token lets that browser finish the row.
ALTER TABLE quiz_starts DROP COLUMN clerk_user_id;
ALTER TABLE quiz_starts DROP COLUMN email;
ALTER TABLE quiz_starts ADD COLUMN token TEXT NOT NULL DEFAULT '';
