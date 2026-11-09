import { dbQuery, hasDatabaseConfig } from "@/lib/backend/db";
import { getResellerSettings, type ResellerSettings } from "@/lib/backend/resellers";
import { getTopSellingProducts, listStorefrontProducts } from "@/lib/backend/storefront-data";
import type { Product } from "@/types/product";

export type SellLandingProduct = {
	category: string;
	id: string;
	imgSrc: string;
	price: number;
	rating: number;
	reviewCount: number;
	slug: string;
	stock: number;
	title: string;
	unitsSold: number;
};

/** Everything the public dropshipping landing shows - all real, all optional. */
export type SellLandingData = {
	basis: "rating" | "sales";
	products: SellLandingProduct[];
	settings: ResellerSettings | null;
	stats: { categories: number; products: number; stores: number } | null;
	/** The priciest product a seller can list today, for the most they can earn on one sale. */
	topPrice: number | null;
};

const SHOWN = 12;

function toLandingProduct(product: Product & { unitsSold?: number }): SellLandingProduct {
	return {
		category: product.category?.[0] ?? "",
		id: product.catalogId ?? String(product.id),
		imgSrc: product.imgSrc,
		price: product.price,
		rating: product.rating ?? 0,
		reviewCount: product.reviewCount ?? 0,
		slug: product.slug ?? String(product.id),
		stock: product.availableQuantity ?? 0,
		title: product.title,
		unitsSold: product.unitsSold ?? 0,
	};
}

const sellable = (product: Product) => Boolean(product.inStock && product.imgSrc);

const EMPTY: SellLandingData = { basis: "rating", products: [], settings: null, stats: null, topPrice: null };

// The homepage is the busiest page and this data barely moves, so it's
// shared for a few minutes rather than re-queried on every visit.
const CACHE_TTL_MS = 5 * 60 * 1000;
let cached: { expires: number; value: Promise<SellLandingData> } | null = null;

export function getSellLandingData(): Promise<SellLandingData> {
	if (!hasDatabaseConfig()) return Promise.resolve(EMPTY);
	if (!cached || cached.expires < Date.now()) {
		const load = loadSellLandingData();
		const entry = { expires: Date.now() + CACHE_TTL_MS, value: load.then(({ data }) => data) };
		cached = entry;
		// A partial result (some query failed) serves this visit but isn't kept.
		const drop = () => {
			if (cached === entry) cached = null;
		};
		load.then(({ complete }) => {
			if (!complete) drop();
		}, drop);
	}
	return cached.value;
}

// Each part fails on its own: a slow stats query must not hide the products.
async function loadSellLandingData(): Promise<{ complete: boolean; data: SellLandingData }> {
	const [settings, top, fresh, stats, topPrice] = await Promise.all([
		getResellerSettings().catch(() => null),
		getTopSellingProducts({ limit: 16, period: "this-month" }).catch(() => null),
		// Tops up a quiet month's short best-seller list.
		listStorefrontProducts({ limit: 24 }).catch(() => null),
		dbQuery<{ categories: string; products: string; stores: string }>(
			`SELECT
				(SELECT count(*) FROM products WHERE status IN ('published', 'low stock')) AS products,
				(SELECT count(*) FROM reseller_stores WHERE status = 'active') AS stores,
				(SELECT count(*) FROM categories WHERE status = 'published') AS categories`,
		)
			.then(({ rows }) => ({
				categories: Number(rows[0]?.categories ?? 0),
				products: Number(rows[0]?.products ?? 0),
				stores: Number(rows[0]?.stores ?? 0),
			}))
			.catch(() => null),
		// The same rules as `sellable`: live, in stock and with a photo.
		dbQuery<{ price: string }>(
			`SELECT price FROM products
				WHERE status IN ('published', 'low stock') AND stock > 0 AND image_url IS NOT NULL AND image_url <> ''
				ORDER BY price DESC LIMIT 1`,
		)
			.then(({ rows }) => (rows[0] ? Number(rows[0].price) : null))
			.catch(() => null),
	]);

	const products = (top?.items ?? []).filter(sellable).map(toLandingProduct);
	const seen = new Set(products.map((product) => product.id));
	for (const product of fresh ?? []) {
		if (products.length >= SHOWN) break;
		const item = toLandingProduct(product);
		if (!sellable(product) || seen.has(item.id)) continue;
		seen.add(item.id);
		products.push(item);
	}

	return {
		complete: Boolean(settings && top && fresh && stats),
		data: {
			basis: top?.basis ?? "rating",
			products: products.slice(0, SHOWN),
			settings,
			stats,
			topPrice,
		},
	};
}
