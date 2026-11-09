-- Privacy-safe storefront analytics for reseller stores: what happened
-- (store view, product view, add to cart), where the visitor came from, and
-- an opaque per-browser hash that rotates daily. No IP address, user agent
-- or personal data is stored. Old rows are pruned by the app (180 days).
--
-- Deliberately no realtime NOTIFY trigger: "resellers" is a public topic
-- and a notification per page view would make every open cart refetch.

CREATE TABLE IF NOT EXISTS reseller_store_events (
	id bigserial PRIMARY KEY,
	store_id uuid NOT NULL REFERENCES reseller_stores(id) ON DELETE CASCADE,
	event text NOT NULL CHECK (event IN ('view_store', 'view_product', 'add_to_cart')),
	product_id uuid REFERENCES products(id) ON DELETE SET NULL,
	source text NOT NULL DEFAULT 'direct' CHECK (source IN ('whatsapp', 'instagram', 'facebook', 'youtube', 'google', 'direct', 'other')),
	-- sha256(browser id + store id), truncated: counts unique visitors without identifying anyone.
	visitor text NOT NULL CHECK (char_length(visitor) BETWEEN 8 AND 64),
	created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS reseller_store_events_store_time_idx
	ON reseller_store_events (store_id, created_at DESC);
CREATE INDEX IF NOT EXISTS reseller_store_events_product_idx
	ON reseller_store_events (store_id, product_id, event)
	WHERE product_id IS NOT NULL;
