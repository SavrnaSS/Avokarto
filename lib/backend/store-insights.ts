import { createHash } from "node:crypto";
import { dbQuery } from "@/lib/backend/db";
import { HttpError } from "@/lib/backend/http";
import { refreshEarnings } from "@/lib/backend/resellers";
import { TRAFFIC_SOURCES, type TrafficSource } from "@/lib/storeTraffic";

export type StoreEvent = "add_to_cart" | "view_product" | "view_store";
const EVENTS: StoreEvent[] = ["add_to_cart", "view_product", "view_store"];
const RETENTION_DAYS = 180;

// Crawlers and headless/scripted clients aren't shoppers. (Link-preview
// fetchers like WhatsApp's never run the page's JavaScript, so they can't
// send events - and WhatsApp's in-app browser is a real shopper.)
const BOT_PATTERN = /bot|crawl|spider|slurp|headless|lighthouse|pingdom|curl|wget|python|axios|node-fetch/i;

export function isBot(userAgent: string | null) {
	return !userAgent || BOT_PATTERN.test(userAgent);
}

/** Record one storefront event. Unknown stores/products are ignored silently. */
export async function recordStoreEvent(input: {
	event: string;
	handle: string;
	productSlug?: string;
	source: string;
	visitorId: string;
}) {
	if (!EVENTS.includes(input.event as StoreEvent)) throw new HttpError(400, "Unknown event.", "INVALID_EVENT");
	if (!/^[a-z0-9-]{8,64}$/i.test(input.visitorId)) throw new HttpError(400, "Invalid visitor id.", "INVALID_VISITOR");
	const source: TrafficSource = TRAFFIC_SOURCES.includes(input.source as TrafficSource) ? (input.source as TrafficSource) : "other";

	const result = await dbQuery(
		`
			INSERT INTO reseller_store_events (store_id, event, product_id, source, visitor)
			SELECT s.id, $2, p.id, $4, $5
			FROM reseller_stores s
			LEFT JOIN products p ON $3::text IS NOT NULL AND p.slug = $3
			WHERE s.handle = $1 AND s.status = 'active'
				AND ($3::text IS NULL OR p.id IS NOT NULL)
		`,
		[
			input.handle.toLowerCase(),
			input.event,
			input.event === "view_store" ? null : input.productSlug?.slice(0, 200) ?? null,
			source,
			// Hash with the store id so the same browser can't be linked across stores.
			createHash("sha256").update(`${input.visitorId}:${input.handle}`).digest("base64url").slice(0, 24),
		],
	);

	// Opportunistic retention pruning keeps the table bounded without a cron job.
	if (Math.random() < 0.002) {
		void dbQuery(`DELETE FROM reseller_store_events WHERE created_at < now() - make_interval(days => $1)`, [RETENTION_DAYS]).catch(() => undefined);
	}
	return result.rowCount ?? 0;
}

type Totals = { add_to_cart: number; product_views: number; store_views: number; visitors: number };
type Sold = { earned: string; orders: number; sales: string };

function rate(part: number, whole: number) {
	return whole > 0 ? Math.round((part / whole) * 1000) / 10 : 0;
}

/** Everything the seller's Insights tab shows, for the last `days` days vs the period before. */
export async function getStoreInsights(storeId: string, days: number) {
	const span = [7, 30, 90].includes(days) ? days : 30;
	await refreshEarnings();

	// Few, combined queries: a session-mode pooler has only a handful of
	// connections, so this dashboard mustn't fan out. Each period query
	// returns one row for this period ("current") and one for the one before.
	const [totals, orders, daily, sources, products] = await Promise.all([
		dbQuery<Totals & { current: boolean; live: number }>(
			`
				SELECT created_at >= now() - make_interval(days => $2) AS current,
					count(DISTINCT visitor)::int AS visitors,
					count(DISTINCT visitor) FILTER (WHERE created_at >= now() - interval '5 minutes')::int AS live,
					count(*) FILTER (WHERE event = 'view_store')::int AS store_views,
					count(*) FILTER (WHERE event = 'view_product')::int AS product_views,
					count(*) FILTER (WHERE event = 'add_to_cart')::int AS add_to_cart
				FROM reseller_store_events
				WHERE store_id = $1 AND created_at >= now() - make_interval(days => $2 * 2)
				GROUP BY 1
			`,
			[storeId, span],
		),
		dbQuery<Sold & { current: boolean }>(
			`
				SELECT e.created_at >= now() - make_interval(days => $2) AS current,
					count(DISTINCT e.order_id)::int AS orders,
					COALESCE(sum(e.sale_unit_price * e.quantity), 0)::text AS sales,
					COALESCE(sum(e.net_amount), 0)::text AS earned
				FROM reseller_earnings e
				WHERE e.store_id = $1 AND e.status <> 'cancelled' AND e.created_at >= now() - make_interval(days => $2 * 2)
				GROUP BY 1
			`,
			[storeId, span],
		),
		dbQuery<{ day: string; orders: number; visitors: number }>(
			`
				SELECT to_char(d.day, 'YYYY-MM-DD') AS day,
					(SELECT count(DISTINCT visitor)::int FROM reseller_store_events v
						WHERE v.store_id = $1 AND v.created_at >= d.day AND v.created_at < d.day + interval '1 day') AS visitors,
					(SELECT count(DISTINCT order_id)::int FROM reseller_earnings o
						WHERE o.store_id = $1 AND o.status <> 'cancelled' AND o.created_at >= d.day AND o.created_at < d.day + interval '1 day') AS orders
				FROM generate_series(current_date - ($2::int - 1), current_date, interval '1 day') AS d(day)
				ORDER BY d.day
			`,
			[storeId, span],
		),
		dbQuery<{ add_to_cart: number; source: TrafficSource; visitors: number }>(
			`
				SELECT source, count(DISTINCT visitor)::int AS visitors,
					count(*) FILTER (WHERE event = 'add_to_cart')::int AS add_to_cart
				FROM reseller_store_events
				WHERE store_id = $1 AND created_at >= now() - make_interval(days => $2)
				GROUP BY source ORDER BY visitors DESC
			`,
			[storeId, span],
		),
		dbQuery<{ add_to_cart: number; image_url: string; name: string; orders: number; slug: string; views: number }>(
			`
				WITH activity AS (
					SELECT product_id,
						count(*) FILTER (WHERE event = 'view_product')::int AS views,
						count(*) FILTER (WHERE event = 'add_to_cart')::int AS add_to_cart
					FROM reseller_store_events
					WHERE store_id = $1 AND product_id IS NOT NULL AND created_at >= now() - make_interval(days => $2)
					GROUP BY product_id
				), sold AS (
					SELECT product_id, count(DISTINCT order_id)::int AS orders
					FROM reseller_earnings
					WHERE store_id = $1 AND status <> 'cancelled' AND created_at >= now() - make_interval(days => $2)
					GROUP BY product_id
				)
				SELECT p.name, p.slug, p.image_url,
					COALESCE(a.views, 0) AS views, COALESCE(a.add_to_cart, 0) AS add_to_cart, COALESCE(s.orders, 0) AS orders
				FROM products p
				LEFT JOIN activity a ON a.product_id = p.id
				LEFT JOIN sold s ON s.product_id = p.id
				WHERE a.product_id IS NOT NULL OR s.product_id IS NOT NULL
				ORDER BY COALESCE(s.orders, 0) DESC, COALESCE(a.add_to_cart, 0) DESC, COALESCE(a.views, 0) DESC
				LIMIT 10
			`,
			[storeId, span],
		),
	]);

	const noTotals = { add_to_cart: 0, live: 0, product_views: 0, store_views: 0, visitors: 0 };
	const noSales = { earned: "0", orders: 0, sales: "0" };
	const now = totals.rows.find((row) => row.current) ?? noTotals;
	const before = totals.rows.find((row) => !row.current) ?? noTotals;
	const sold = orders.rows.find((row) => row.current) ?? noSales;
	const soldBefore = orders.rows.find((row) => !row.current) ?? noSales;
	const change = (a: number, b: number) => (b > 0 ? Math.round(((a - b) / b) * 1000) / 10 : null);

	return {
		days: span,
		daily: daily.rows,
		liveVisitors: now.live,
		products: products.rows.map((row) => ({
			addToCart: row.add_to_cart,
			conversion: rate(row.orders, row.views),
			imageUrl: row.image_url,
			name: row.name,
			orders: row.orders,
			slug: row.slug,
			views: row.views,
		})),
		sources: sources.rows.map((row) => ({ addToCart: row.add_to_cart, source: row.source, visitors: row.visitors })),
		totals: {
			addToCart: now.add_to_cart,
			addToCartRate: rate(now.add_to_cart, now.product_views),
			conversion: rate(sold.orders, now.visitors),
			earned: Number(sold.earned),
			orders: sold.orders,
			productViews: now.product_views,
			sales: Number(sold.sales),
			storeViews: now.store_views,
			visitors: now.visitors,
		},
		changes: {
			conversion: change(rate(sold.orders, now.visitors), rate(soldBefore.orders, before.visitors)),
			orders: change(sold.orders, soldBefore.orders),
			sales: change(Number(sold.sales), Number(soldBefore.sales)),
			visitors: change(now.visitors, before.visitors),
		},
	};
}
