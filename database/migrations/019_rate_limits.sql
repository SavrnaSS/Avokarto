-- Fixed-window request counters for abuse-prone endpoints (logins, signup,
-- contact, checkout, reviews). Kept in the database so every app instance
-- shares one count. UNLOGGED: counters are cheap to lose on a crash and
-- skipping the WAL keeps each hit a fast single-row upsert.
CREATE UNLOGGED TABLE IF NOT EXISTS rate_limit_buckets (
	key text PRIMARY KEY,
	window_start timestamptz NOT NULL,
	hits integer NOT NULL
);

CREATE INDEX IF NOT EXISTS rate_limit_buckets_window_start_idx
	ON rate_limit_buckets (window_start);
