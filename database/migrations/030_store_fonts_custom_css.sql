-- Store design: a font pairing (lib/storeFonts.ts) and the seller's
-- "Additional CSS" (lib/storeCustomCss.ts). Both are edited in the seller's
-- store customizer. Existing stores keep their theme's fonts and no custom
-- CSS. The app validates the CSS content; the database caps its size.

ALTER TABLE reseller_stores
	ADD COLUMN IF NOT EXISTS font text NOT NULL DEFAULT 'theme',
	ADD COLUMN IF NOT EXISTS custom_css text NOT NULL DEFAULT '';

ALTER TABLE reseller_stores DROP CONSTRAINT IF EXISTS reseller_stores_design_valid;

ALTER TABLE reseller_stores
	ADD CONSTRAINT reseller_stores_design_valid CHECK (
		font IN ('theme', 'modern', 'geometric', 'friendly', 'tech', 'editorial', 'boutique', 'classic', 'loud')
		AND char_length(custom_css) <= 10000
	);
