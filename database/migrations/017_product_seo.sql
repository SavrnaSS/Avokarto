-- Per-product search engine settings (admin > Products > SEO tab).
-- Every column has a default, so existing rows need no backfill and the
-- storefront falls back to the product's own name/description/images.

ALTER TABLE products
	ADD COLUMN IF NOT EXISTS seo_title text NOT NULL DEFAULT '',
	ADD COLUMN IF NOT EXISTS seo_description text NOT NULL DEFAULT '',
	ADD COLUMN IF NOT EXISTS seo_keywords text[] NOT NULL DEFAULT ARRAY[]::text[],
	-- Alt text keyed by image URL, so it survives gallery reordering/pinning.
	ADD COLUMN IF NOT EXISTS image_alts jsonb NOT NULL DEFAULT '{}'::jsonb,
	-- Global Trade Item Number (UPC/EAN/ISBN) and manufacturer part number:
	-- the identifiers Google uses to match a product across sellers.
	ADD COLUMN IF NOT EXISTS gtin text NOT NULL DEFAULT '',
	ADD COLUMN IF NOT EXISTS mpn text NOT NULL DEFAULT '',
	ADD COLUMN IF NOT EXISTS seo_noindex boolean NOT NULL DEFAULT false;

DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM pg_constraint WHERE conname = 'products_gtin_format'
	) THEN
		ALTER TABLE products
			ADD CONSTRAINT products_gtin_format
			CHECK (gtin = '' OR gtin ~ '^([0-9]{8}|[0-9]{12,14})$');
	END IF;

	IF NOT EXISTS (
		SELECT 1 FROM pg_constraint WHERE conname = 'products_image_alts_object'
	) THEN
		ALTER TABLE products
			ADD CONSTRAINT products_image_alts_object
			CHECK (jsonb_typeof(image_alts) = 'object');
	END IF;
END $$;

-- Retired URL handles. When a product's slug changes, its old slug is kept
-- here so /product/<old-slug> permanently redirects instead of 404ing and
-- losing the page's search ranking.
CREATE TABLE IF NOT EXISTS product_slug_redirects (
	old_slug text PRIMARY KEY,
	product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
	created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS product_slug_redirects_product_id_idx
	ON product_slug_redirects (product_id);
