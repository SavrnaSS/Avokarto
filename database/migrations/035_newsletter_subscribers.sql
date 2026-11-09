-- Newsletter sign-ups from the storefront footer (lib/backend/newsletter.ts).
-- One row per address; signing up again only refreshes updated_at.

CREATE TABLE IF NOT EXISTS newsletter_subscribers (
	email text PRIMARY KEY,
	source text NOT NULL DEFAULT 'footer',
	created_at timestamptz NOT NULL DEFAULT now(),
	updated_at timestamptz NOT NULL DEFAULT now()
);
