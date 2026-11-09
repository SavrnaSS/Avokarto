-- Store-wide contact info (name/support email/phone/address/chat link) shown
-- on the storefront /contact page and edited from /admin/settings. A single
-- fixed-id row rather than a list resource, since a store only has one of
-- each of these.
CREATE TABLE IF NOT EXISTS store_settings (
	id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
	store_name text NOT NULL DEFAULT '',
	support_email text NOT NULL DEFAULT '',
	support_phone text NOT NULL DEFAULT '',
	address text NOT NULL DEFAULT '',
	chat_link text NOT NULL DEFAULT '',
	updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO store_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

DROP TRIGGER IF EXISTS set_updated_at_store_settings ON store_settings;
CREATE TRIGGER set_updated_at_store_settings BEFORE UPDATE ON store_settings
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- The storefront contact form creates a real support ticket per submission,
-- reusing the existing admin ticket queue instead of a parallel inbox. The
-- table previously had nowhere to put the sender's reply-to info or their
-- actual message.
ALTER TABLE support_tickets
	ADD COLUMN IF NOT EXISTS email text,
	ADD COLUMN IF NOT EXISTS phone text,
	ADD COLUMN IF NOT EXISTS message text NOT NULL DEFAULT '';
