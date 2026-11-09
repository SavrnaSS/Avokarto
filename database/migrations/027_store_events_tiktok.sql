-- TikTok as a store traffic source (see lib/storeTraffic.ts): sellers post
-- Avokarto promo reels there, and their caption links carry ?ref=tiktok.

ALTER TABLE reseller_store_events DROP CONSTRAINT IF EXISTS reseller_store_events_source_check;

ALTER TABLE reseller_store_events
	ADD CONSTRAINT reseller_store_events_source_check
	CHECK (source IN ('whatsapp', 'instagram', 'facebook', 'youtube', 'tiktok', 'google', 'direct', 'other'));
