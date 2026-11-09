ALTER TABLE products
ADD COLUMN IF NOT EXISTS short_summary_image text NOT NULL DEFAULT '';
