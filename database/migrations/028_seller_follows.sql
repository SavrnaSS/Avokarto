-- Public seller profiles on Avokarto (/sellers/<handle>): shoppers follow
-- the reseller stores they like. One row per follower per store; counts are
-- read live (see lib/backend/seller-profiles.ts).

CREATE TABLE IF NOT EXISTS reseller_store_follows (
	store_id uuid NOT NULL REFERENCES reseller_stores(id) ON DELETE CASCADE,
	customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
	created_at timestamptz NOT NULL DEFAULT now(),
	PRIMARY KEY (store_id, customer_id)
);

CREATE INDEX IF NOT EXISTS reseller_store_follows_customer_idx
	ON reseller_store_follows (customer_id, created_at DESC);
