import { cache } from "react";
import { dbQuery } from "@/lib/backend/db";
import { HttpError } from "@/lib/backend/http";
import { getResellerSettings, type StoreSocials } from "@/lib/backend/resellers";
import { resellerPrice, type MarginType } from "@/lib/resellerPricing";
import { DEFAULT_STORE_THEME, isStoreTheme, type StoreTheme } from "@/lib/storeThemes";

/*
 * Public seller profiles: every active reseller store gets an Avokarto
 * profile (/sellers/<handle>) - cover, avatar, follower count, catalog,
 * reels and badges - that links out to the seller's own themed store
 * (/store/<handle> or their custom domain). The same summary feeds the
 * seller directory (/sellers) and the "Sold by" block on product pages.
 *
 * Only public data leaves this module: no margins, payout details,
 * moderation notes or follower identities.
 */

export type SellerBadge = "partner" | "top-seller" | "highly-rated" | "new" | "own-domain" | "wide-catalog";

export type SellerSummary = {
	accentColor: string;
	badges: SellerBadge[];
	bannerUrl: string;
	domain: string | null;
	followers: number;
	handle: string;
	id: string;
	logoUrl: string;
	name: string;
	orders: number;
	/** A few product images, featured first, for cards. */
	previewImages: string[];
	products: number;
	/** Review-weighted rating of the products the seller lists (null with no reviews). */
	rating: number | null;
	reviews: number;
	since: string;
	/** Where the seller's own store lives: their custom domain, else /store/<handle>. */
	storeUrl: string;
	tagline: string;
	theme: StoreTheme;
};

export type SellerProduct = {
	category: string;
	featured: boolean;
	id: string;
	imageUrl: string;
	inStock: boolean;
	name: string;
	oldPrice: number | null;
	price: number;
	rating: number;
	reviewCount: number;
	slug: string;
	createdAt: string;
};

export type SellerReel = {
	durationSeconds: number | null;
	id: string;
	posterUrl: string;
	product: { imageUrl: string; name: string; price: number; slug: string };
	title: string;
	videoUrl: string;
};

export type SellerProfile = SellerSummary & {
	about: string;
	announcement: string;
	categories: { count: number; name: string }[];
	contactEmail: string;
	isFollowing: boolean;
	listings: SellerProduct[];
	reels: SellerReel[];
	similar: SellerSummary[];
	socials: StoreSocials;
	whatsapp: string;
};

export type ProductSeller = SellerSummary & { inStock: boolean; price: number };

export type SellerSort = "popular" | "newest" | "products" | "rating";
export const SELLER_SORTS: SellerSort[] = ["popular", "newest", "products", "rating"];

/* ------------------------------------------------------------------------
 * Shared summary query
 * --------------------------------------------------------------------- */

type SummaryRow = {
	accent_color: string;
	banner_url: string;
	created_at: Date;
	domain: string | null;
	followers: number;
	handle: string;
	id: string;
	logo_url: string;
	name: string;
	orders: number;
	preview_images: string[] | null;
	products: number;
	rating: string | null;
	reviews: number;
	tagline: string;
	theme: string;
};

// Products, reviews, followers and fulfilled orders per store. Lateral
// joins keep each count independent (no row multiplication).
const SUMMARY_SELECT = `
	SELECT s.id::text, s.handle, s.name, s.tagline, s.accent_color, s.logo_url, s.banner_url,
		s.theme, s.created_at, d.domain,
		coalesce(st.products, 0) AS products, coalesce(st.reviews, 0) AS reviews, st.rating,
		coalesce(f.followers, 0) AS followers, coalesce(o.orders, 0) AS orders, pv.preview_images
	FROM reseller_stores s
	LEFT JOIN reseller_store_domains d ON d.store_id = s.id AND d.status = 'active'
	LEFT JOIN LATERAL (
		SELECT count(*)::int AS products, coalesce(sum(p.review_count), 0)::int AS reviews,
			CASE WHEN sum(p.review_count) > 0
				THEN round(sum(p.rating * p.review_count) / sum(p.review_count), 1) END AS rating
		FROM reseller_listings l JOIN products p ON p.id = l.product_id
		WHERE l.store_id = s.id AND l.is_active AND p.status IN ('published', 'low stock')
	) st ON true
	LEFT JOIN LATERAL (
		SELECT count(*)::int AS followers FROM reseller_store_follows WHERE store_id = s.id
	) f ON true
	LEFT JOIN LATERAL (
		SELECT count(DISTINCT order_id)::int AS orders FROM reseller_earnings
		WHERE store_id = s.id AND status <> 'cancelled'
	) o ON true
	LEFT JOIN LATERAL (
		SELECT array_agg(image_url) AS preview_images FROM (
			SELECT p.image_url FROM reseller_listings l JOIN products p ON p.id = l.product_id
			WHERE l.store_id = s.id AND l.is_active AND p.status IN ('published', 'low stock') AND p.image_url <> ''
			ORDER BY l.featured DESC, l.created_at DESC LIMIT 4
		) images
	) pv ON true
`;

const DAY_MS = 24 * 60 * 60 * 1000;

/** Badges are earned from real numbers only, never set by hand. */
function badgesFor(row: SummaryRow): SellerBadge[] {
	const badges: SellerBadge[] = ["partner"];
	const rating = row.rating === null ? null : Number(row.rating);
	if (row.orders >= 25) badges.push("top-seller");
	if (rating !== null && rating >= 4.5 && row.reviews >= 20) badges.push("highly-rated");
	if (row.domain) badges.push("own-domain");
	if (row.products >= 50) badges.push("wide-catalog");
	if (Date.now() - row.created_at.getTime() < 30 * DAY_MS) badges.push("new");
	return badges;
}

function toSummary(row: SummaryRow): SellerSummary {
	return {
		accentColor: row.accent_color,
		badges: badgesFor(row),
		bannerUrl: row.banner_url ?? "",
		domain: row.domain,
		followers: row.followers,
		handle: row.handle,
		id: row.id,
		logoUrl: row.logo_url ?? "",
		name: row.name,
		orders: row.orders,
		previewImages: row.preview_images ?? [],
		products: row.products,
		rating: row.rating === null ? null : Number(row.rating),
		reviews: row.reviews,
		since: row.created_at.toISOString(),
		storeUrl: row.domain ? `https://${row.domain}` : `/store/${row.handle}`,
		tagline: row.tagline,
		theme: isStoreTheme(row.theme) ? row.theme : DEFAULT_STORE_THEME,
	};
}

const SORT_SQL: Record<SellerSort, string> = {
	newest: "s.created_at DESC",
	popular: "followers DESC, orders DESC, products DESC, s.created_at",
	products: "products DESC, followers DESC",
	rating: "st.rating DESC NULLS LAST, reviews DESC",
};

/* ------------------------------------------------------------------------
 * Directory
 * --------------------------------------------------------------------- */

export async function listSellers({
	page = 1,
	perPage = 24,
	q = "",
	sort = "popular",
}: { page?: number; perPage?: number; q?: string; sort?: SellerSort }) {
	const search = q.trim().slice(0, 60);
	const pattern = `%${search.replace(/[\\%_]/g, (char) => `\\${char}`)}%`;
	const offset = (Math.max(1, page) - 1) * perPage;
	const result = await dbQuery<SummaryRow & { total: number }>(
		`
			SELECT * FROM (
				${SUMMARY_SELECT.replace("SELECT s.id::text", "SELECT count(*) OVER ()::int AS total, s.id::text")}
				WHERE s.status = 'active' AND coalesce(st.products, 0) > 0
					AND ($1 = '' OR s.name ILIKE $2 OR s.handle ILIKE $2 OR s.tagline ILIKE $2)
				ORDER BY ${SORT_SQL[sort] ?? SORT_SQL.popular}
				LIMIT $3 OFFSET $4
			) sellers
		`,
		[search, pattern, perPage, offset],
	);
	return {
		sellers: result.rows.map(toSummary),
		total: result.rows[0]?.total ?? 0,
	};
}

/* ------------------------------------------------------------------------
 * Product page: who sells this product
 * --------------------------------------------------------------------- */

export async function listProductSellers(productId: string, limit = 6) {
	if (!/^[0-9a-f-]{36}$/i.test(productId)) return { sellers: [] as ProductSeller[], total: 0 };
	const settings = await getResellerSettings();
	const result = await dbQuery<SummaryRow & {
		margin_type: MarginType;
		margin_value: string;
		price: string;
		product_status: string;
		stock: number;
		total: number;
	}>(
		`
			${SUMMARY_SELECT.replace(
				"SELECT s.id::text",
				"SELECT count(*) OVER ()::int AS total, l.margin_type, l.margin_value, p.price, p.stock, p.status AS product_status, s.id::text",
			)}
			JOIN reseller_listings l ON l.store_id = s.id AND l.product_id = $1 AND l.is_active
			JOIN products p ON p.id = l.product_id
			WHERE s.status = 'active' AND p.status IN ('published', 'low stock')
			ORDER BY followers DESC, orders DESC, s.created_at
			LIMIT $2
		`,
		[productId, limit],
	);
	return {
		sellers: result.rows.map((row): ProductSeller => ({
			...toSummary(row),
			inStock: row.stock > 0,
			price: resellerPrice(Number(row.price), row.margin_type, Number(row.margin_value), settings).salePrice,
		})),
		total: result.rows[0]?.total ?? 0,
	};
}

/* ------------------------------------------------------------------------
 * Profile
 * --------------------------------------------------------------------- */

type ProfileRow = SummaryRow & {
	about: string;
	announcement: string;
	contact_email: string;
	socials: StoreSocials | null;
	whatsapp: string;
};

type ProductRow = {
	category_name: string | null;
	category_id: string | null;
	created_at: Date;
	featured: boolean;
	id: string;
	image_url: string;
	margin_type: MarginType;
	margin_value: string;
	name: string;
	old_price: string | null;
	price: string;
	rating: string;
	review_count: number;
	slug: string;
	stock: number;
};

export const getSellerProfile = cache(async (handle: string, viewerId: string | null = null): Promise<SellerProfile | null> => {
	if (!/^[a-z0-9-]{3,40}$/i.test(handle)) return null;
	const result = await dbQuery<ProfileRow>(
		`${SUMMARY_SELECT.replace(
			"SELECT s.id::text",
			"SELECT s.about, s.announcement, s.contact_email, s.socials, s.whatsapp, s.id::text",
		)}
		WHERE s.handle = $1 AND s.status = 'active'`,
		[handle.toLowerCase()],
	);
	const row = result.rows[0];
	if (!row) return null;
	const summary = toSummary(row);
	const settings = await getResellerSettings();

	const [productRows, following] = await Promise.all([
		dbQuery<ProductRow>(
			`
				SELECT p.id::text, p.name, p.slug, p.image_url, p.price, p.old_price, p.stock, p.rating,
					p.review_count, l.featured, l.created_at, l.margin_type, l.margin_value,
					c.name AS category_name, c.id::text AS category_id
				FROM reseller_listings l
				JOIN products p ON p.id = l.product_id
				LEFT JOIN categories c ON c.id = p.category_id
				WHERE l.store_id = $1 AND l.is_active AND p.status IN ('published', 'low stock')
				ORDER BY l.featured DESC, l.created_at DESC
				LIMIT 300
			`,
			[summary.id],
		),
		viewerId
			? dbQuery<{ exists: boolean }>(
				"SELECT EXISTS (SELECT 1 FROM reseller_store_follows WHERE store_id = $1 AND customer_id = $2) AS exists",
				[summary.id, viewerId],
			).then((res) => res.rows[0]?.exists ?? false).catch(() => false)
			: Promise.resolve(false),
	]);

	const listings = productRows.rows.map((product): SellerProduct => {
		const { salePrice } = resellerPrice(Number(product.price), product.margin_type, Number(product.margin_value), settings);
		const oldPrice = product.old_price === null ? null : Number(product.old_price);
		return {
			category: product.category_name ?? "",
			createdAt: product.created_at.toISOString(),
			featured: product.featured,
			id: product.id,
			imageUrl: product.image_url,
			inStock: product.stock > 0,
			name: product.name,
			// A strike-through price only when it's still above the seller's price.
			oldPrice: oldPrice !== null && oldPrice > salePrice ? oldPrice : null,
			price: salePrice,
			rating: Number(product.rating),
			reviewCount: product.review_count,
			slug: product.slug,
		};
	});

	const counts = new Map<string, number>();
	for (const listing of listings) {
		if (listing.category) counts.set(listing.category, (counts.get(listing.category) ?? 0) + 1);
	}
	const categories = [...counts]
		.map(([name, count]) => ({ count, name }))
		.sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
	const categoryIds = [...new Set(productRows.rows.map((product) => product.category_id).filter(Boolean))] as string[];

	const [reels, similar] = await Promise.all([
		sellerReels(listings),
		similarSellers(summary.id, categoryIds),
	]);

	return {
		...summary,
		about: row.about ?? "",
		announcement: row.announcement ?? "",
		categories,
		contactEmail: row.contact_email ?? "",
		isFollowing: following,
		listings,
		reels,
		similar,
		socials: row.socials ?? {},
		whatsapp: row.whatsapp ?? "",
	};
});

async function sellerReels(listings: SellerProduct[]): Promise<SellerReel[]> {
	if (!listings.length) return [];
	const byProduct = new Map(listings.map((listing) => [listing.id, listing]));
	const result = await dbQuery<{
		duration_seconds: string | null;
		id: string;
		poster_url: string;
		product_id: string;
		title: string;
		video_url: string;
	}>(
		`
			SELECT id::text, product_id::text, video_url, poster_url, title, duration_seconds
			FROM product_reels WHERE product_id = ANY($1::uuid[])
			ORDER BY position, created_at DESC LIMIT 24
		`,
		[[...byProduct.keys()]],
	);
	return result.rows.map((reel) => {
		const product = byProduct.get(reel.product_id)!;
		return {
			durationSeconds: reel.duration_seconds === null ? null : Number(reel.duration_seconds),
			id: reel.id,
			posterUrl: reel.poster_url || product.imageUrl,
			product: { imageUrl: product.imageUrl, name: product.name, price: product.price, slug: product.slug },
			title: reel.title || product.name,
			videoUrl: reel.video_url,
		};
	});
}

/** Sellers in the same categories, most-followed first; the top sellers when none overlap. */
async function similarSellers(storeId: string, categoryIds: string[]) {
	const result = await dbQuery<SummaryRow & { overlap: boolean }>(
		`
			${SUMMARY_SELECT.replace(
				"SELECT s.id::text",
				`SELECT EXISTS (
					SELECT 1 FROM reseller_listings l2 JOIN products p2 ON p2.id = l2.product_id
					WHERE l2.store_id = s.id AND l2.is_active AND p2.category_id = ANY($2::uuid[])
				) AS overlap, s.id::text`,
			)}
			WHERE s.status = 'active' AND s.id <> $1 AND coalesce(st.products, 0) > 0
			ORDER BY overlap DESC, followers DESC, orders DESC
			LIMIT 4
		`,
		[storeId, categoryIds],
	);
	return result.rows.map(toSummary);
}

/* ------------------------------------------------------------------------
 * Follows
 * --------------------------------------------------------------------- */

async function storeIdForHandle(handle: string) {
	const result = await dbQuery<{ id: string }>(
		"SELECT id::text FROM reseller_stores WHERE handle = $1 AND status = 'active'",
		[handle.toLowerCase()],
	);
	const id = result.rows[0]?.id;
	if (!id) throw new HttpError(404, "This seller isn't available.", "SELLER_NOT_FOUND");
	return id;
}

async function followerCount(storeId: string) {
	const result = await dbQuery<{ count: number }>(
		"SELECT count(*)::int AS count FROM reseller_store_follows WHERE store_id = $1",
		[storeId],
	);
	return result.rows[0]?.count ?? 0;
}

export async function getFollowState(handle: string, customerId: string | null) {
	const storeId = await storeIdForHandle(handle);
	const [followers, following] = await Promise.all([
		followerCount(storeId),
		customerId
			? dbQuery("SELECT 1 FROM reseller_store_follows WHERE store_id = $1 AND customer_id = $2", [storeId, customerId])
				.then((res) => (res.rowCount ?? 0) > 0)
			: false,
	]);
	return { followers, following };
}

export async function setFollowing(handle: string, customerId: string, follow: boolean) {
	const storeId = await storeIdForHandle(handle);
	if (follow) {
		// Sellers can't follow their own store.
		const own = await dbQuery("SELECT 1 FROM reseller_stores WHERE id = $1 AND customer_id = $2", [storeId, customerId]);
		if (own.rowCount) throw new HttpError(400, "You can't follow your own store.", "OWN_STORE");
		await dbQuery(
			"INSERT INTO reseller_store_follows (store_id, customer_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
			[storeId, customerId],
		);
	} else {
		await dbQuery("DELETE FROM reseller_store_follows WHERE store_id = $1 AND customer_id = $2", [storeId, customerId]);
	}
	return { followers: await followerCount(storeId), following: follow };
}
