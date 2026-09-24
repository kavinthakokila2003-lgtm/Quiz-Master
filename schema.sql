CREATE TABLE IF NOT EXISTS app_state (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  body TEXT NOT NULL,
  version INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  kind TEXT NOT NULL,
  team_code TEXT NOT NULL DEFAULT '',
  expires INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS sessions_expires_idx ON sessions(expires);
