-- Category identity belongs to the category row, not its display name or
-- slug. Keep a merchant-controlled storefront order and normalize names so
-- whitespace/case variations cannot recreate an existing category.

ALTER TABLE categories
	ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 100;

-- Preserve the oldest category as the canonical row, including custom slugs
-- such as `costume`, and move every product assignment before deleting clones.
WITH ranked AS (
	SELECT
		id,
		first_value(id) OVER (
			PARTITION BY lower(regexp_replace(btrim(name), '[[:space:]]+', ' ', 'g'))
			ORDER BY created_at ASC, id ASC
		) AS canonical_id
	FROM categories
),
merges AS (
	SELECT id, canonical_id
	FROM ranked
	WHERE id <> canonical_id
)
UPDATE products
SET category_id = merges.canonical_id
FROM merges
WHERE products.category_id = merges.id;

DELETE FROM categories
WHERE id IN (
	SELECT id
	FROM (
		SELECT
			id,
			first_value(id) OVER (
				PARTITION BY lower(regexp_replace(btrim(name), '[[:space:]]+', ' ', 'g'))
				ORDER BY created_at ASC, id ASC
			) AS canonical_id
		FROM categories
	) ranked
	WHERE id <> canonical_id
);

DROP INDEX IF EXISTS categories_name_unique_idx;

CREATE UNIQUE INDEX categories_name_unique_idx
	ON categories (
		lower(regexp_replace(btrim(name), '[[:space:]]+', ' ', 'g'))
	);

DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1
		FROM pg_constraint
		WHERE conname = 'categories_sort_order_range'
	) THEN
		ALTER TABLE categories
			ADD CONSTRAINT categories_sort_order_range
			CHECK (sort_order BETWEEN 0 AND 1000000);
	END IF;
END
$$;

-- Initial merchandising order requested for the fashion storefront. Future
-- changes are controlled through the admin category editor.
UPDATE categories
SET sort_order = CASE
	WHEN lower(regexp_replace(btrim(name), '[[:space:]]+', ' ', 'g')) = 'summer fashion' THEN 0
	WHEN lower(regexp_replace(btrim(name), '[[:space:]]+', ' ', 'g')) = 'new arrivals' THEN 1000000
	ELSE sort_order
END
WHERE lower(regexp_replace(btrim(name), '[[:space:]]+', ' ', 'g')) IN (
	'summer fashion',
	'new arrivals'
);

CREATE INDEX IF NOT EXISTS categories_storefront_order_idx
	ON categories (status, sort_order, lower(name));
