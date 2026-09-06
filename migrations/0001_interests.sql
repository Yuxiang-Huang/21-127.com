-- One row per User who currently has an Interest.
CREATE TABLE interests (
	clerk_user_id TEXT PRIMARY KEY,
	email TEXT,
	created_at TEXT NOT NULL
);
