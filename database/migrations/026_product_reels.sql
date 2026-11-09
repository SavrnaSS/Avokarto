-- Promo reels: short vertical videos Avokarto makes for a catalog product,
-- which resellers download and post to Instagram Reels, TikTok and YouTube
-- Shorts (see lib/backend/product-reels.ts). Videos and posters are files
-- uploaded through Avokarto (/api/uploads/...), never external links.

CREATE TABLE IF NOT EXISTS product_reels (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
	video_url text NOT NULL,
	poster_url text NOT NULL DEFAULT '',
	title text NOT NULL DEFAULT '',
	duration_seconds numeric(6, 1),
	size_bytes bigint NOT NULL DEFAULT 0,
	position integer NOT NULL DEFAULT 0,
	created_at timestamptz NOT NULL DEFAULT now(),
	CONSTRAINT product_reels_files_valid CHECK (
		video_url ~ '^/api/uploads/[a-f0-9-]+\.mp4$'
		AND (poster_url = '' OR poster_url ~ '^/api/uploads/[a-f0-9-]+\.(jpg|png|webp)$')
		AND char_length(title) <= 120
		AND (duration_seconds IS NULL OR duration_seconds BETWEEN 0 AND 600)
	)
);

CREATE INDEX IF NOT EXISTS product_reels_product_idx ON product_reels (product_id, position, created_at);
