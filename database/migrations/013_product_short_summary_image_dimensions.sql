ALTER TABLE products
ADD COLUMN IF NOT EXISTS short_summary_image_width integer,
ADD COLUMN IF NOT EXISTS short_summary_image_height integer;
