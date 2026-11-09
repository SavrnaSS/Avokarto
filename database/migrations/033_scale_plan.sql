-- Third seller plan: Scale (lib/billing/plans.ts).

ALTER TABLE seller_subscriptions DROP CONSTRAINT IF EXISTS seller_subscriptions_plan_check;
ALTER TABLE seller_subscriptions
	ADD CONSTRAINT seller_subscriptions_plan_check CHECK (plan IN ('starter', 'pro', 'scale'));
