-- One row each time a User starts a Quiz.
CREATE TABLE quiz_starts (
	id INTEGER PRIMARY KEY AUTOINCREMENT,
	clerk_user_id TEXT NOT NULL,
	email TEXT,
	page TEXT NOT NULL,
	difficulty TEXT NOT NULL,
	started_at TEXT NOT NULL
);
