-- Catalog data the admin product form collects (Pricing > tax, Shipping,
-- Variations, Product Specifications > review videos). Every column has a
-- default, so existing rows need no backfill.

ALTER TABLE products
	ADD COLUMN IF NOT EXISTS tax_class text NOT NULL DEFAULT 'standard',
	-- NULL = no product-specific VAT rate.
	ADD COLUMN IF NOT EXISTS vat_rate numeric(5, 2),
	-- Package size for shipping: kilograms and centimetres.
	ADD COLUMN IF NOT EXISTS weight_kg numeric(10, 3),
	ADD COLUMN IF NOT EXISTS width_cm numeric(10, 2),
	ADD COLUMN IF NOT EXISTS height_cm numeric(10, 2),
	ADD COLUMN IF NOT EXISTS length_cm numeric(10, 2),
	-- [{ "attribute": "Size", "value": "XL" }, …]
	ADD COLUMN IF NOT EXISTS variations jsonb NOT NULL DEFAULT '[]'::jsonb,
	ADD COLUMN IF NOT EXISTS review_video_urls text[] NOT NULL DEFAULT ARRAY[]::text[];

DO $$
BEGIN
	IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_tax_class_valid') THEN
		ALTER TABLE products
			ADD CONSTRAINT products_tax_class_valid
			CHECK (tax_class IN ('standard', 'reduced', 'zero'));
	END IF;

	IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_vat_rate_range') THEN
		ALTER TABLE products
			ADD CONSTRAINT products_vat_rate_range
			CHECK (vat_rate IS NULL OR (vat_rate >= 0 AND vat_rate <= 100));
	END IF;

	IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_dimensions_non_negative') THEN
		ALTER TABLE products
			ADD CONSTRAINT products_dimensions_non_negative
			CHECK (
				(weight_kg IS NULL OR weight_kg >= 0)
				AND (width_cm IS NULL OR width_cm >= 0)
				AND (height_cm IS NULL OR height_cm >= 0)
				AND (length_cm IS NULL OR length_cm >= 0)
			);
	END IF;

	IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_variations_array') THEN
		ALTER TABLE products
			ADD CONSTRAINT products_variations_array
			CHECK (jsonb_typeof(variations) = 'array');
	END IF;
END $$;
