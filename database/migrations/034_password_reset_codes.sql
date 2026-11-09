-- One-time password reset codes (lib/backend/password-reset.ts). A 6-digit
-- code is emailed; only its keyed hash is stored. Codes expire after 15
-- minutes, allow 5 guesses, and requesting a new one replaces the old one.

CREATE TABLE IF NOT EXISTS password_reset_codes (
	customer_id uuid PRIMARY KEY REFERENCES customers(id) ON DELETE CASCADE,
	code_hash text NOT NULL,
	attempts integer NOT NULL DEFAULT 0,
	expires_at timestamptz NOT NULL,
	created_at timestamptz NOT NULL DEFAULT now()
);
