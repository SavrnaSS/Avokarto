CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS schema_migrations (
	version text PRIMARY KEY,
	applied_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS app_users (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	email text NOT NULL UNIQUE,
	password_hash text NOT NULL,
	name text NOT NULL,
	role text NOT NULL CHECK (role IN ('admin', 'manager', 'support', 'customer')),
	status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disabled', 'review')),
	created_at timestamptz NOT NULL DEFAULT now(),
	updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS categories (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	name text NOT NULL,
	slug text NOT NULL UNIQUE,
	description text NOT NULL DEFAULT '',
	image_url text NOT NULL DEFAULT '/assets/images/catagory-img/cat-bg-headphones-01.webp',
	status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
	meta jsonb NOT NULL DEFAULT '{}'::jsonb,
	created_at timestamptz NOT NULL DEFAULT now(),
	updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS brands (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	name text NOT NULL,
	slug text NOT NULL UNIQUE,
	website text NOT NULL DEFAULT '',
	initials text NOT NULL DEFAULT '',
	tile_class text NOT NULL DEFAULT 'bg-brand-50 text-brand-600',
	visibility text NOT NULL DEFAULT 'Standard' CHECK (visibility IN ('Featured', 'Hidden', 'Standard')),
	status text NOT NULL DEFAULT 'draft' CHECK (status IN ('archived', 'draft', 'published')),
	description text NOT NULL DEFAULT '',
	meta jsonb NOT NULL DEFAULT '{}'::jsonb,
	created_at timestamptz NOT NULL DEFAULT now(),
	updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS products (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	legacy_id integer UNIQUE,
	sku text NOT NULL UNIQUE,
	name text NOT NULL,
	slug text NOT NULL UNIQUE,
	description text NOT NULL DEFAULT '',
	category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
	brand_id uuid REFERENCES brands(id) ON DELETE SET NULL,
	image_url text NOT NULL DEFAULT '/assets/images/product-img/fashion/product-new-01-a-1.webp',
	hover_image_url text,
	price numeric(12, 2) NOT NULL CHECK (price >= 0),
	old_price numeric(12, 2) CHECK (old_price IS NULL OR old_price >= 0),
	stock integer NOT NULL DEFAULT 0 CHECK (stock >= 0),
	status text NOT NULL DEFAULT 'draft' CHECK (status IN ('archived', 'draft', 'low stock', 'published')),
	rating numeric(3, 2) NOT NULL DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
	review_count integer NOT NULL DEFAULT 0 CHECK (review_count >= 0),
	storefront_badge text,
	tags text[] NOT NULL DEFAULT ARRAY[]::text[],
	filter_color text[] NOT NULL DEFAULT ARRAY[]::text[],
	filter_sizes text[] NOT NULL DEFAULT ARRAY[]::text[],
	services text[] NOT NULL DEFAULT ARRAY[]::text[],
	demo_tab text[] NOT NULL DEFAULT ARRAY[]::text[],
	attributes jsonb NOT NULL DEFAULT '{}'::jsonb,
	created_at timestamptz NOT NULL DEFAULT now(),
	updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS customers (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	name text NOT NULL,
	email text NOT NULL UNIQUE,
	segment text NOT NULL DEFAULT 'Retail',
	status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'review')),
	avatar_class text NOT NULL DEFAULT 'bg-brand-50 text-brand-600',
	created_at timestamptz NOT NULL DEFAULT now(),
	updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS orders (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	order_number text NOT NULL UNIQUE,
	customer_id uuid REFERENCES customers(id) ON DELETE SET NULL,
	customer_name text NOT NULL,
	status text NOT NULL DEFAULT 'delivering' CHECK (status IN ('completed', 'delivering', 'failed', 'pending', 'cancelled')),
	total numeric(12, 2) NOT NULL DEFAULT 0 CHECK (total >= 0),
	currency text NOT NULL DEFAULT 'USD',
	payment_status text NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('paid', 'unpaid', 'refunded')),
	created_at timestamptz NOT NULL DEFAULT now(),
	updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS order_items (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
	product_id uuid REFERENCES products(id) ON DELETE SET NULL,
	product_name text NOT NULL,
	sku text NOT NULL,
	image_url text NOT NULL DEFAULT '/assets/images/products/organic-food-a-01.webp',
	qty integer NOT NULL CHECK (qty > 0),
	unit_price numeric(12, 2) NOT NULL CHECK (unit_price >= 0),
	created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS coupons (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	code text NOT NULL UNIQUE,
	name text NOT NULL,
	summary text NOT NULL DEFAULT '',
	type text NOT NULL CHECK (type IN ('fixed', 'percentage', 'shipping')),
	discount_value numeric(12, 2) NOT NULL DEFAULT 0 CHECK (discount_value >= 0),
	minimum_order numeric(12, 2) NOT NULL DEFAULT 0 CHECK (minimum_order >= 0),
	maximum_discount numeric(12, 2),
	usage_limit integer,
	used_count integer NOT NULL DEFAULT 0 CHECK (used_count >= 0),
	status text NOT NULL DEFAULT 'draft' CHECK (status IN ('active', 'draft', 'expired', 'scheduled')),
	starts_at date,
	ends_at date,
	icon_class text NOT NULL DEFAULT 'bg-brand-50 text-brand-600',
	created_at timestamptz NOT NULL DEFAULT now(),
	updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS product_reviews (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	product_id uuid REFERENCES products(id) ON DELETE SET NULL,
	product_name text NOT NULL,
	customer_id uuid REFERENCES customers(id) ON DELETE SET NULL,
	customer_name text NOT NULL,
	rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
	review text NOT NULL,
	status text NOT NULL DEFAULT 'pending' CHECK (status IN ('approved', 'draft', 'pending')),
	created_at timestamptz NOT NULL DEFAULT now(),
	updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS support_tickets (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	ticket_number text NOT NULL UNIQUE,
	title text NOT NULL,
	customer_id uuid REFERENCES customers(id) ON DELETE SET NULL,
	customer_name text NOT NULL,
	priority text NOT NULL DEFAULT 'Medium' CHECK (priority IN ('High', 'Low', 'Medium')),
	status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'pending', 'resolved')),
	assignee text NOT NULL DEFAULT 'Support Team',
	created_at timestamptz NOT NULL DEFAULT now(),
	updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS product_attributes (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	name text NOT NULL UNIQUE,
	type text NOT NULL CHECK (type IN ('Dropdown', 'Swatch', 'Text')),
	values text[] NOT NULL DEFAULT ARRAY[]::text[],
	status text NOT NULL DEFAULT 'draft' CHECK (status IN ('active', 'draft')),
	products_count integer NOT NULL DEFAULT 0 CHECK (products_count >= 0),
	created_at timestamptz NOT NULL DEFAULT now(),
	updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON product_reviews(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger AS $$
BEGIN
	NEW.updated_at = now();
	RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION notify_unimart_realtime()
RETURNS trigger AS $$
DECLARE
	row_payload jsonb;
BEGIN
	row_payload = to_jsonb(COALESCE(NEW, OLD));
	PERFORM pg_notify(
		'unimart_realtime',
		json_build_object(
			'topic', TG_ARGV[0],
			'action', TG_OP,
			'table', TG_TABLE_NAME,
			'id', row_payload ->> 'id',
			'changedAt', now()
		)::text
	);
	RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at_app_users ON app_users;
CREATE TRIGGER set_updated_at_app_users BEFORE UPDATE ON app_users
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_categories ON categories;
CREATE TRIGGER set_updated_at_categories BEFORE UPDATE ON categories
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_brands ON brands;
CREATE TRIGGER set_updated_at_brands BEFORE UPDATE ON brands
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_products ON products;
CREATE TRIGGER set_updated_at_products BEFORE UPDATE ON products
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_customers ON customers;
CREATE TRIGGER set_updated_at_customers BEFORE UPDATE ON customers
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_orders ON orders;
CREATE TRIGGER set_updated_at_orders BEFORE UPDATE ON orders
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_coupons ON coupons;
CREATE TRIGGER set_updated_at_coupons BEFORE UPDATE ON coupons
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_product_reviews ON product_reviews;
CREATE TRIGGER set_updated_at_product_reviews BEFORE UPDATE ON product_reviews
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_support_tickets ON support_tickets;
CREATE TRIGGER set_updated_at_support_tickets BEFORE UPDATE ON support_tickets
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_product_attributes ON product_attributes;
CREATE TRIGGER set_updated_at_product_attributes BEFORE UPDATE ON product_attributes
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS realtime_categories ON categories;
CREATE TRIGGER realtime_categories AFTER INSERT OR UPDATE OR DELETE ON categories
FOR EACH ROW EXECUTE FUNCTION notify_unimart_realtime('categories');

DROP TRIGGER IF EXISTS realtime_brands ON brands;
CREATE TRIGGER realtime_brands AFTER INSERT OR UPDATE OR DELETE ON brands
FOR EACH ROW EXECUTE FUNCTION notify_unimart_realtime('brands');

DROP TRIGGER IF EXISTS realtime_products ON products;
CREATE TRIGGER realtime_products AFTER INSERT OR UPDATE OR DELETE ON products
FOR EACH ROW EXECUTE FUNCTION notify_unimart_realtime('products');

DROP TRIGGER IF EXISTS realtime_customers ON customers;
CREATE TRIGGER realtime_customers AFTER INSERT OR UPDATE OR DELETE ON customers
FOR EACH ROW EXECUTE FUNCTION notify_unimart_realtime('customers');

DROP TRIGGER IF EXISTS realtime_orders ON orders;
CREATE TRIGGER realtime_orders AFTER INSERT OR UPDATE OR DELETE ON orders
FOR EACH ROW EXECUTE FUNCTION notify_unimart_realtime('orders');

DROP TRIGGER IF EXISTS realtime_order_items_orders ON order_items;
CREATE TRIGGER realtime_order_items_orders AFTER INSERT OR UPDATE OR DELETE ON order_items
FOR EACH ROW EXECUTE FUNCTION notify_unimart_realtime('orders');

DROP TRIGGER IF EXISTS realtime_order_items_products ON order_items;
CREATE TRIGGER realtime_order_items_products AFTER INSERT OR UPDATE OR DELETE ON order_items
FOR EACH ROW EXECUTE FUNCTION notify_unimart_realtime('products');

DROP TRIGGER IF EXISTS realtime_coupons ON coupons;
CREATE TRIGGER realtime_coupons AFTER INSERT OR UPDATE OR DELETE ON coupons
FOR EACH ROW EXECUTE FUNCTION notify_unimart_realtime('coupons');

DROP TRIGGER IF EXISTS realtime_product_reviews ON product_reviews;
CREATE TRIGGER realtime_product_reviews AFTER INSERT OR UPDATE OR DELETE ON product_reviews
FOR EACH ROW EXECUTE FUNCTION notify_unimart_realtime('reviews');

DROP TRIGGER IF EXISTS realtime_support_tickets ON support_tickets;
CREATE TRIGGER realtime_support_tickets AFTER INSERT OR UPDATE OR DELETE ON support_tickets
FOR EACH ROW EXECUTE FUNCTION notify_unimart_realtime('support-tickets');

DROP TRIGGER IF EXISTS realtime_product_attributes ON product_attributes;
CREATE TRIGGER realtime_product_attributes AFTER INSERT OR UPDATE OR DELETE ON product_attributes
FOR EACH ROW EXECUTE FUNCTION notify_unimart_realtime('attributes');
