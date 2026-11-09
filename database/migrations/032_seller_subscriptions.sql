-- Seller subscriptions, billed through Whop (lib/backend/billing.ts).
-- Whop is the source of truth: its membership webhooks keep one row per
-- seller here, and the seller's store goes offline ('unpaid') when the
-- plan stops granting access. Nothing is enforced until an admin turns on
-- reseller_settings.subscriptions_required, so existing stores keep working
-- while Whop is being set up.

ALTER TABLE reseller_settings
	ADD COLUMN IF NOT EXISTS subscriptions_required boolean NOT NULL DEFAULT false;

-- 'unpaid': hidden like a suspended store, but set and cleared by billing
-- only - an admin suspension is never overwritten by a payment.
ALTER TABLE reseller_stores DROP CONSTRAINT IF EXISTS reseller_stores_status_check;
ALTER TABLE reseller_stores
	ADD CONSTRAINT reseller_stores_status_check CHECK (status IN ('active', 'suspended', 'unpaid'));

CREATE TABLE IF NOT EXISTS seller_subscriptions (
	customer_id uuid PRIMARY KEY REFERENCES customers(id) ON DELETE CASCADE,
	plan text NOT NULL CHECK (plan IN ('starter', 'pro')),
	-- Whop membership (mem_...) and its status: trialing, active, past_due,
	-- completed, canceled, expired or unresolved.
	whop_membership_id text NOT NULL UNIQUE,
	status text NOT NULL,
	current_period_end timestamptz,
	cancel_at_period_end boolean NOT NULL DEFAULT false,
	manage_url text NOT NULL DEFAULT '',
	-- Whop's own updated_at for the membership, so a late, out-of-order
	-- webhook can't roll the row back.
	whop_updated_at timestamptz,
	created_at timestamptz NOT NULL DEFAULT now(),
	updated_at timestamptz NOT NULL DEFAULT now()
);

-- Webhook deliveries already applied (Whop retries and may duplicate).
CREATE TABLE IF NOT EXISTS whop_webhook_events (
	id text PRIMARY KEY,
	type text NOT NULL,
	received_at timestamptz NOT NULL DEFAULT now()
);
