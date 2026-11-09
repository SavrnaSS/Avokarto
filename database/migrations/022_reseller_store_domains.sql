-- Custom domains for reseller stores (e.g. shop.meerascloset.com).
-- A domain only serves the store once its DNS proves ownership (TXT record)
-- and points at Avokarto (CNAME, or A records for an apex domain).

CREATE TABLE IF NOT EXISTS reseller_store_domains (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	-- One custom domain per store.
	store_id uuid NOT NULL UNIQUE REFERENCES reseller_stores(id) ON DELETE CASCADE,
	-- Lower-case hostname, no scheme, port or path.
	domain text NOT NULL UNIQUE CHECK (
		domain = lower(domain)
		AND char_length(domain) BETWEEN 4 AND 253
		AND domain ~ '^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$'
	),
	verification_token text NOT NULL,
	status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'failed')),
	-- Plain-language result of the last DNS check, shown to the seller.
	last_error text NOT NULL DEFAULT '',
	last_checked_at timestamptz,
	verified_at timestamptz,
	created_at timestamptz NOT NULL DEFAULT now(),
	updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS reseller_store_domains_active_idx
	ON reseller_store_domains (domain) WHERE status = 'active';

DROP TRIGGER IF EXISTS set_updated_at_reseller_store_domains ON reseller_store_domains;
CREATE TRIGGER set_updated_at_reseller_store_domains BEFORE UPDATE ON reseller_store_domains
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS notify_reseller_store_domains ON reseller_store_domains;
CREATE TRIGGER notify_reseller_store_domains AFTER INSERT OR UPDATE OR DELETE ON reseller_store_domains
FOR EACH ROW EXECUTE FUNCTION notify_unimart_realtime('resellers');
