ALTER TABLE customers
ADD COLUMN IF NOT EXISTS date_of_birth date,
ADD COLUMN IF NOT EXISTS locale text NOT NULL DEFAULT 'English',
ADD COLUMN IF NOT EXISTS default_address jsonb NOT NULL DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS alternate_address jsonb NOT NULL DEFAULT '{}'::jsonb;

-- "deleted" is a soft-delete: Account Info's delete action deactivates the
-- customer rather than removing the row, so existing orders/reviews/support
-- tickets referencing customer_id keep their history intact. Signing back
-- in with the correct password reactivates it (see authorizeCustomer).
ALTER TABLE customers DROP CONSTRAINT customers_status_check;
ALTER TABLE customers ADD CONSTRAINT customers_status_check
	CHECK (status = ANY (ARRAY['active'::text, 'review'::text, 'deleted'::text]));
