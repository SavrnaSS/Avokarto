CREATE TABLE IF NOT EXISTS shipping_methods (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	name text NOT NULL UNIQUE,
	description text NOT NULL DEFAULT '',
	carrier text NOT NULL DEFAULT '',
	price numeric(12, 2) NOT NULL DEFAULT 0 CHECK (price >= 0),
	min_delivery_days integer,
	max_delivery_days integer,
	status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
	sort_order integer NOT NULL DEFAULT 0,
	created_at timestamptz NOT NULL DEFAULT now(),
	updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE orders
ADD COLUMN IF NOT EXISTS shipping_method_id uuid REFERENCES shipping_methods(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS shipping_method_name text NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS shipping_cost numeric(12, 2) NOT NULL DEFAULT 0 CHECK (shipping_cost >= 0);

DROP TRIGGER IF EXISTS set_updated_at_shipping_methods ON shipping_methods;
CREATE TRIGGER set_updated_at_shipping_methods BEFORE UPDATE ON shipping_methods
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS realtime_shipping_methods ON shipping_methods;
CREATE TRIGGER realtime_shipping_methods AFTER INSERT OR UPDATE OR DELETE ON shipping_methods
FOR EACH ROW EXECUTE FUNCTION notify_unimart_realtime('shipping-methods');
