-- Admin -> Settings: Shipping (free-shipping rule), Payments (methods shown
-- at checkout) and Permissions (admin session length). Read by
-- lib/backend/store-policy.ts. Defaults match the previous hard-coded rules.

ALTER TABLE store_settings
	ADD COLUMN IF NOT EXISTS free_shipping_enabled boolean NOT NULL DEFAULT true,
	ADD COLUMN IF NOT EXISTS free_shipping_threshold numeric(10, 2) NOT NULL DEFAULT 100 CHECK (free_shipping_threshold >= 0),
	ADD COLUMN IF NOT EXISTS payment_methods text[] NOT NULL DEFAULT ARRAY['card', 'paypal', 'googlepay', 'cod'],
	ADD COLUMN IF NOT EXISTS admin_session_days integer CHECK (admin_session_days BETWEEN 1 AND 30);
