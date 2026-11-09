-- Store branding, so each reseller store reads as its own website: logo,
-- cover banner, visual theme, about text, announcement bar and contact links.
-- Images must be files uploaded through Avokarto (/api/uploads/...), never
-- arbitrary external URLs.

ALTER TABLE reseller_stores
	ADD COLUMN IF NOT EXISTS logo_url text NOT NULL DEFAULT '',
	ADD COLUMN IF NOT EXISTS banner_url text NOT NULL DEFAULT '',
	ADD COLUMN IF NOT EXISTS theme text NOT NULL DEFAULT 'modern',
	ADD COLUMN IF NOT EXISTS about text NOT NULL DEFAULT '',
	ADD COLUMN IF NOT EXISTS announcement text NOT NULL DEFAULT '',
	ADD COLUMN IF NOT EXISTS contact_email text NOT NULL DEFAULT '',
	-- { "instagram": "https://…", "facebook": "…", "youtube": "…", "website": "…" }
	ADD COLUMN IF NOT EXISTS socials jsonb NOT NULL DEFAULT '{}'::jsonb;

DO $$
BEGIN
	IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'reseller_stores_branding_valid') THEN
		ALTER TABLE reseller_stores
			ADD CONSTRAINT reseller_stores_branding_valid CHECK (
				(logo_url = '' OR logo_url ~ '^/api/uploads/[a-f0-9-]+\.(jpg|png|webp)$')
				AND (banner_url = '' OR banner_url ~ '^/api/uploads/[a-f0-9-]+\.(jpg|png|webp)$')
				AND theme IN ('modern', 'bold', 'minimal', 'elegant')
				AND char_length(about) <= 1000
				AND char_length(announcement) <= 140
				AND char_length(contact_email) <= 120
				AND jsonb_typeof(socials) = 'object'
			);
	END IF;
END $$;
