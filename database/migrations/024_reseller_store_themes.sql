-- Six more store themes (see lib/storeThemes.ts). Re-creates the branding
-- check with the longer theme list; every other rule is unchanged.

ALTER TABLE reseller_stores DROP CONSTRAINT IF EXISTS reseller_stores_branding_valid;

ALTER TABLE reseller_stores
	ADD CONSTRAINT reseller_stores_branding_valid CHECK (
		(logo_url = '' OR logo_url ~ '^/api/uploads/[a-f0-9-]+\.(jpg|png|webp)$')
		AND (banner_url = '' OR banner_url ~ '^/api/uploads/[a-f0-9-]+\.(jpg|png|webp)$')
		AND theme IN ('modern', 'bold', 'minimal', 'elegant', 'noir', 'aurora', 'playful', 'street', 'editorial', 'organic')
		AND char_length(about) <= 1000
		AND char_length(announcement) <= 140
		AND char_length(contact_email) <= 120
		AND jsonb_typeof(socials) = 'object'
	);
