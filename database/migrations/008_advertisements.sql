CREATE TABLE IF NOT EXISTS advertisements (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	title text NOT NULL UNIQUE,
	image_url text NOT NULL,
	link_url text NOT NULL DEFAULT '',
	status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
	sort_order integer NOT NULL DEFAULT 0,
	created_at timestamptz NOT NULL DEFAULT now(),
	updated_at timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS set_updated_at_advertisements ON advertisements;
CREATE TRIGGER set_updated_at_advertisements BEFORE UPDATE ON advertisements
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS realtime_advertisements ON advertisements;
CREATE TRIGGER realtime_advertisements AFTER INSERT OR UPDATE OR DELETE ON advertisements
FOR EACH ROW EXECUTE FUNCTION notify_unimart_realtime('advertisements');
