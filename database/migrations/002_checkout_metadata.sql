ALTER TABLE orders
ADD COLUMN IF NOT EXISTS customer_email text NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS customer_phone text NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS payment_method text NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'admin',
ADD COLUMN IF NOT EXISTS billing_address jsonb NOT NULL DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS shipping_address jsonb NOT NULL DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS notes text NOT NULL DEFAULT '';

CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON orders(customer_email);
CREATE INDEX IF NOT EXISTS idx_orders_source ON orders(source);
