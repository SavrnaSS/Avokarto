-- Reseller stores (Shopsy-style): any customer opens a store, picks products
-- from the Avokarto catalog, adds a margin and shares the store. Avokarto
-- fulfils the order; the reseller earns the margin once the order is
-- completed and its return window has passed.

-- One row of marketplace-wide rules, edited in admin > Resellers > Settings.
CREATE TABLE IF NOT EXISTS reseller_settings (
	id boolean PRIMARY KEY DEFAULT true CHECK (id),
	-- Highest margin a reseller may add, as a percentage of the base price.
	max_margin_percent numeric(5, 2) NOT NULL DEFAULT 50 CHECK (max_margin_percent >= 0 AND max_margin_percent <= 500),
	-- Share of each margin Avokarto keeps.
	platform_fee_percent numeric(5, 2) NOT NULL DEFAULT 0 CHECK (platform_fee_percent >= 0 AND platform_fee_percent <= 100),
	-- Days after an order completes before its earnings can be withdrawn.
	hold_days integer NOT NULL DEFAULT 7 CHECK (hold_days >= 0 AND hold_days <= 90),
	min_payout numeric(12, 2) NOT NULL DEFAULT 10 CHECK (min_payout >= 0),
	-- Lets admins pause new store sign-ups without affecting existing stores.
	signups_open boolean NOT NULL DEFAULT true,
	updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO reseller_settings (id) VALUES (true) ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS reseller_stores (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	customer_id uuid NOT NULL UNIQUE REFERENCES customers(id) ON DELETE CASCADE,
	handle text NOT NULL UNIQUE CHECK (handle ~ '^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])$'),
	name text NOT NULL CHECK (char_length(name) BETWEEN 2 AND 60),
	tagline text NOT NULL DEFAULT '' CHECK (char_length(tagline) <= 140),
	-- Brand colour for the storefront header (#rrggbb).
	accent_color text NOT NULL DEFAULT '#3E8315' CHECK (accent_color ~ '^#[0-9a-fA-F]{6}$'),
	whatsapp text NOT NULL DEFAULT '' CHECK (char_length(whatsapp) <= 20),
	-- Margin pre-filled when the reseller adds a product.
	default_margin_percent numeric(5, 2) NOT NULL DEFAULT 15 CHECK (default_margin_percent >= 0),
	status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
	suspended_reason text NOT NULL DEFAULT '',
	-- Payouts can be frozen independently of the storefront.
	payouts_blocked boolean NOT NULL DEFAULT false,
	-- Where payouts go: { "method": "upi" | "bank", ... }.
	payout_details jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(payout_details) = 'object'),
	created_at timestamptz NOT NULL DEFAULT now(),
	updated_at timestamptz NOT NULL DEFAULT now()
);

-- Products a store resells, with the reseller's margin on top of the base price.
CREATE TABLE IF NOT EXISTS reseller_listings (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	store_id uuid NOT NULL REFERENCES reseller_stores(id) ON DELETE CASCADE,
	product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
	margin_type text NOT NULL DEFAULT 'percent' CHECK (margin_type IN ('percent', 'fixed')),
	margin_value numeric(12, 2) NOT NULL DEFAULT 0 CHECK (margin_value >= 0),
	is_active boolean NOT NULL DEFAULT true,
	featured boolean NOT NULL DEFAULT false,
	created_at timestamptz NOT NULL DEFAULT now(),
	updated_at timestamptz NOT NULL DEFAULT now(),
	UNIQUE (store_id, product_id)
);
CREATE INDEX IF NOT EXISTS reseller_listings_store_idx ON reseller_listings (store_id, is_active);
CREATE INDEX IF NOT EXISTS reseller_listings_product_idx ON reseller_listings (product_id);

-- One earnings line per order item sold through a store. Status moves
-- pending -> available (order completed + hold elapsed) or cancelled
-- (order cancelled/failed/refunded); see refresh_reseller_earnings().
CREATE TABLE IF NOT EXISTS reseller_earnings (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	store_id uuid NOT NULL REFERENCES reseller_stores(id) ON DELETE CASCADE,
	order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
	order_item_id uuid REFERENCES order_items(id) ON DELETE SET NULL,
	product_id uuid REFERENCES products(id) ON DELETE SET NULL,
	product_name text NOT NULL,
	quantity integer NOT NULL CHECK (quantity > 0),
	base_unit_price numeric(12, 2) NOT NULL CHECK (base_unit_price >= 0),
	sale_unit_price numeric(12, 2) NOT NULL CHECK (sale_unit_price >= 0),
	margin_amount numeric(12, 2) NOT NULL CHECK (margin_amount >= 0),
	platform_fee numeric(12, 2) NOT NULL DEFAULT 0 CHECK (platform_fee >= 0),
	-- What the reseller actually receives: margin_amount - platform_fee.
	net_amount numeric(12, 2) NOT NULL CHECK (net_amount >= 0),
	status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'available', 'cancelled')),
	available_at timestamptz,
	created_at timestamptz NOT NULL DEFAULT now(),
	updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS reseller_earnings_store_idx ON reseller_earnings (store_id, status);
CREATE INDEX IF NOT EXISTS reseller_earnings_order_idx ON reseller_earnings (order_id);

CREATE TABLE IF NOT EXISTS reseller_payouts (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	store_id uuid NOT NULL REFERENCES reseller_stores(id) ON DELETE CASCADE,
	amount numeric(12, 2) NOT NULL CHECK (amount > 0),
	status text NOT NULL DEFAULT 'requested' CHECK (status IN ('requested', 'paid', 'rejected')),
	-- Payout details as they were when requested.
	payout_details jsonb NOT NULL DEFAULT '{}'::jsonb,
	reference text NOT NULL DEFAULT '',
	admin_note text NOT NULL DEFAULT '',
	requested_at timestamptz NOT NULL DEFAULT now(),
	processed_at timestamptz,
	updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS reseller_payouts_store_idx ON reseller_payouts (store_id, status);
-- One open request per store at a time.
CREATE UNIQUE INDEX IF NOT EXISTS reseller_payouts_one_open_idx
	ON reseller_payouts (store_id) WHERE status = 'requested';

-- When an order completes, so the earnings hold period can be measured
-- from delivery rather than from the last edit.
ALTER TABLE orders ADD COLUMN IF NOT EXISTS completed_at timestamptz;

CREATE OR REPLACE FUNCTION set_order_completed_at()
RETURNS trigger AS $$
BEGIN
	IF NEW.status = 'completed' AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'completed') THEN
		NEW.completed_at = now();
	ELSIF NEW.status <> 'completed' THEN
		NEW.completed_at = NULL;
	END IF;
	RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_order_completed_at ON orders;
CREATE TRIGGER set_order_completed_at BEFORE INSERT OR UPDATE OF status ON orders
FOR EACH ROW EXECUTE FUNCTION set_order_completed_at();

UPDATE orders SET completed_at = updated_at WHERE status = 'completed' AND completed_at IS NULL;

-- Bring earnings in line with their orders. Cheap and idempotent; called
-- before balances are read, so no scheduler is needed.
CREATE OR REPLACE FUNCTION refresh_reseller_earnings()
RETURNS void AS $$
	UPDATE reseller_earnings e
	SET status = 'cancelled', available_at = NULL, updated_at = now()
	FROM orders o
	WHERE o.id = e.order_id AND e.status <> 'cancelled'
		AND (o.status IN ('cancelled', 'failed') OR o.payment_status = 'refunded');

	UPDATE reseller_earnings e
	SET status = 'available', available_at = o.completed_at + make_interval(days => s.hold_days), updated_at = now()
	FROM orders o, reseller_settings s
	WHERE o.id = e.order_id AND e.status = 'pending'
		AND o.status = 'completed' AND o.payment_status <> 'refunded'
		AND o.completed_at + make_interval(days => s.hold_days) <= now();

	-- An order reopened after completing moves its earnings back to pending.
	UPDATE reseller_earnings e
	SET status = 'pending', available_at = NULL, updated_at = now()
	FROM orders o
	WHERE o.id = e.order_id AND e.status = 'cancelled'
		AND o.status IN ('pending', 'delivering', 'completed') AND o.payment_status <> 'refunded';
$$ LANGUAGE sql;

DROP TRIGGER IF EXISTS set_updated_at_reseller_stores ON reseller_stores;
CREATE TRIGGER set_updated_at_reseller_stores BEFORE UPDATE ON reseller_stores
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS set_updated_at_reseller_listings ON reseller_listings;
CREATE TRIGGER set_updated_at_reseller_listings BEFORE UPDATE ON reseller_listings
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS set_updated_at_reseller_payouts ON reseller_payouts;
CREATE TRIGGER set_updated_at_reseller_payouts BEFORE UPDATE ON reseller_payouts
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Live updates for the seller dashboard and admin pages (payload carries
-- only the row id - see notify_unimart_realtime()).
DROP TRIGGER IF EXISTS notify_reseller_stores ON reseller_stores;
CREATE TRIGGER notify_reseller_stores AFTER INSERT OR UPDATE OR DELETE ON reseller_stores
FOR EACH ROW EXECUTE FUNCTION notify_unimart_realtime('resellers');
DROP TRIGGER IF EXISTS notify_reseller_listings ON reseller_listings;
CREATE TRIGGER notify_reseller_listings AFTER INSERT OR UPDATE OR DELETE ON reseller_listings
FOR EACH ROW EXECUTE FUNCTION notify_unimart_realtime('resellers');
DROP TRIGGER IF EXISTS notify_reseller_earnings ON reseller_earnings;
CREATE TRIGGER notify_reseller_earnings AFTER INSERT OR UPDATE OR DELETE ON reseller_earnings
FOR EACH ROW EXECUTE FUNCTION notify_unimart_realtime('resellers');
DROP TRIGGER IF EXISTS notify_reseller_payouts ON reseller_payouts;
CREATE TRIGGER notify_reseller_payouts AFTER INSERT OR UPDATE OR DELETE ON reseller_payouts
FOR EACH ROW EXECUTE FUNCTION notify_unimart_realtime('resellers');
DROP TRIGGER IF EXISTS notify_reseller_settings ON reseller_settings;
CREATE TRIGGER notify_reseller_settings AFTER UPDATE ON reseller_settings
FOR EACH ROW EXECUTE FUNCTION notify_unimart_realtime('resellers');
