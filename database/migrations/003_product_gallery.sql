ALTER TABLE products
ADD COLUMN IF NOT EXISTS gallery_image_urls text[] NOT NULL DEFAULT ARRAY[]::text[];

-- Backfill existing rows from their current image_url/hover_image_url so the
-- admin gallery UI has something to show immediately instead of an empty
-- state for every product that predates this column.
UPDATE products
SET gallery_image_urls = ARRAY_REMOVE(ARRAY[image_url, hover_image_url], NULL)
WHERE array_length(gallery_image_urls, 1) IS NULL;
