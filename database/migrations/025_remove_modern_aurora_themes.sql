-- Retire the "modern" and "aurora" store themes (see lib/storeThemes.ts).
-- Stores using either move to "minimal", which also becomes the default for
-- new stores; the branding check is re-created with the shorter theme list.
-- Every other rule is unchanged from 024.

UPDATE reseller_stores SET theme = 'minimal' WHERE theme IN ('modern', 'aurora');

ALTER TABLE reseller_stores ALTER COLUMN theme SET DEFAULT 'minimal';

ALTER TABLE reseller_stores DROP CONSTRAINT IF EXISTS reseller_stores_branding_valid;

ALTER TABLE reseller_stores
	ADD CONSTRAINT reseller_stores_branding_valid CHECK (
		(logo_url = '' OR logo_url ~ '^/api/uploads/[a-f0-9-]+\.(jpg|png|webp)$')
		AND (banner_url = '' OR banner_url ~ '^/api/uploads/[a-f0-9-]+\.(jpg|png|webp)$')
		AND theme IN ('minimal', 'bold', 'elegant', 'noir', 'playful', 'street', 'editorial', 'organic')
		AND char_length(about) <= 1000
		AND char_length(announcement) <= 140
		AND char_length(contact_email) <= 120
		AND jsonb_typeof(socials) = 'object'
	);
