-- Categories/brands were only deduplicated by slug, not by name. A product
-- form saving a category/brand by name (not slug) could silently create a
-- second row with the same display name under a different slug whenever
-- that name's existing row had a custom slug (e.g. name "Pets Costume"
-- with slug "costume") - the app-level fix looks up by name first now
-- (see ensureCategory/ensureBrand in lib/backend/admin-mutations.ts), but
-- the schema itself should refuse duplicates outright as a hard backstop.

-- Merge any categories that already collided by name (case-insensitive):
-- keep the oldest row, repoint any products pointing at the newer
-- duplicate(s) to it, then drop the duplicates.
WITH ranked AS (
	SELECT
		id,
		first_value(id) OVER (
			PARTITION BY lower(name) ORDER BY created_at, id
		) AS canonical_id
	FROM categories
),
merges AS (
	SELECT id, canonical_id FROM ranked WHERE id <> canonical_id
)
UPDATE products
SET category_id = merges.canonical_id
FROM merges
WHERE products.category_id = merges.id;

DELETE FROM categories
WHERE id IN (
	SELECT id FROM (
		SELECT
			id,
			first_value(id) OVER (
				PARTITION BY lower(name) ORDER BY created_at, id
			) AS canonical_id
		FROM categories
	) ranked
	WHERE id <> canonical_id
);

-- Same merge for brands, in case any already collided too.
WITH ranked AS (
	SELECT
		id,
		first_value(id) OVER (
			PARTITION BY lower(name) ORDER BY created_at, id
		) AS canonical_id
	FROM brands
),
merges AS (
	SELECT id, canonical_id FROM ranked WHERE id <> canonical_id
)
UPDATE products
SET brand_id = merges.canonical_id
FROM merges
WHERE products.brand_id = merges.id;

DELETE FROM brands
WHERE id IN (
	SELECT id FROM (
		SELECT
			id,
			first_value(id) OVER (
				PARTITION BY lower(name) ORDER BY created_at, id
			) AS canonical_id
		FROM brands
	) ranked
	WHERE id <> canonical_id
);

CREATE UNIQUE INDEX IF NOT EXISTS categories_name_unique_idx ON categories (lower(name));
CREATE UNIQUE INDEX IF NOT EXISTS brands_name_unique_idx ON brands (lower(name));
