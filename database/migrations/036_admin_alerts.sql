-- Admin email alerts (lib/backend/admin-alerts.ts), set in Admin -> Settings ->
-- Notifications: who receives them and which events send one.

ALTER TABLE store_settings
	ADD COLUMN IF NOT EXISTS alert_emails text NOT NULL DEFAULT '',
	ADD COLUMN IF NOT EXISTS alert_new_order boolean NOT NULL DEFAULT true,
	ADD COLUMN IF NOT EXISTS alert_payout_request boolean NOT NULL DEFAULT true,
	ADD COLUMN IF NOT EXISTS alert_new_ticket boolean NOT NULL DEFAULT true,
	ADD COLUMN IF NOT EXISTS alert_new_store boolean NOT NULL DEFAULT true;
