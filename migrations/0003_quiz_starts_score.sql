-- Filled in when the User finishes that start. Score is the result they were shown.
ALTER TABLE quiz_starts ADD COLUMN score TEXT;
ALTER TABLE quiz_starts ADD COLUMN finished INTEGER NOT NULL DEFAULT 0;
