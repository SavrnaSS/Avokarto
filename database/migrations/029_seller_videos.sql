-- Videos a seller makes in Studio → Videos: promo clips rendered in the
-- browser from their store's products, saved here so they can be posted
-- later from any device (see lib/backend/seller-videos.ts). Files are
-- uploads (/api/uploads/...), never external links. MP4 where the
-- seller's browser can record it; WebM otherwise.

CREATE TABLE IF NOT EXISTS seller_videos (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	store_id uuid NOT NULL REFERENCES reseller_stores(id) ON DELETE CASCADE,
	-- The main product shown; kept (as NULL) if the product is later removed.
	product_id uuid REFERENCES products(id) ON DELETE SET NULL,
	video_url text NOT NULL,
	poster_url text NOT NULL DEFAULT '',
	title text NOT NULL DEFAULT '',
	template text NOT NULL,
	aspect text NOT NULL,
	duration_seconds numeric(6, 1) NOT NULL,
	size_bytes bigint NOT NULL DEFAULT 0,
	created_at timestamptz NOT NULL DEFAULT now(),
	CONSTRAINT seller_videos_valid CHECK (
		video_url ~ '^/api/uploads/[a-f0-9-]+\.(mp4|webm)$'
		AND (poster_url = '' OR poster_url ~ '^/api/uploads/[a-f0-9-]+\.(jpg|png|webp)$')
		AND char_length(title) <= 120
		AND template IN ('spotlight', 'price-drop', 'collection', 'minimal')
		AND aspect IN ('9:16', '1:1', '16:9')
		AND duration_seconds BETWEEN 1 AND 60
	)
);

CREATE INDEX IF NOT EXISTS seller_videos_store_idx ON seller_videos (store_id, created_at DESC);
