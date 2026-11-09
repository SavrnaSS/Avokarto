import { parseImageAlts } from "@/lib/productSeoFields";
import type {
	Attribute,
	Brand,
	Category,
	Customer,
} from "@/admin/data/admin/catalog";
import type {
	Advertisement,
	Coupon,
	Order,
	ProductReview,
	ShippingMethod,
	SupportTicket,
} from "@/admin/data/admin/operations";
import type {
	Product as AdminProduct,
	ProductStatus,
} from "@/admin/data/products/data";
import { dbQuery } from "@/lib/backend/db";
import { HttpError } from "@/lib/backend/http";

export const adminResourceTopics = [
	"advertisements",
	"attributes",
	"brands",
	"categories",
	"coupons",
	"customers",
	"orders",
	"products",
	"reviews",
	"shipping-methods",
	"support-tickets",
] as const;

export type AdminResourceTopic = (typeof adminResourceTopics)[number];
// "users" is intentionally excluded from adminResourceTopics: that array also
// gates which SSE topics require admin auth in app/api/realtime/route.ts, and
// app_users has no realtime NOTIFY trigger (unlike every other admin table),
// so it isn't a live-updating topic.
export type AdminResource =
	| AdminResourceTopic
	| "attention"
	| "dashboard"
	| "store-settings"
	| "users";

const adminResourceSet = new Set<string>([
	"attention",
	"dashboard",
	"store-settings",
	"users",
	...adminResourceTopics,
]);

type AdminProductRow = {
	category_name: string | null;
	id: string;
	image_url: string;
	name: string;
	price: number | string;
	sku: string;
	status: "archived" | ProductStatus;
	stock: number;
};

type CategoryRow = {
	count: number;
	id: string;
	image_url: string;
	name: string;
	slug: string;
	sort_order: number;
	status: Category["status"];
};

type BrandRow = {
	count: number;
	initials: string;
	name: string;
	slug: string;
	status: Brand["status"];
	tile_class: string;
	visibility: Brand["visibility"];
	website: string;
};

type AttributeRow = {
	id: string;
	name: string;
	products_count: number;
	status: Attribute["status"];
	type: Attribute["type"];
	values: string[] | null;
};

type CustomerRow = {
	avatar_class: string;
	email: string;
	ltv: number | string;
	name: string;
	orders: number;
	segment: string;
	status: Customer["status"];
};

type OrderRow = {
	created_at: Date | string;
	customer_name: string;
	order_number: string;
	status: Order["status"];
	total: number | string;
	updated_at: Date | string;
};

type CouponRow = {
	code: string;
	discount_value: number | string;
	ends_at: Date | string | null;
	icon_class: string;
	name: string;
	starts_at: Date | string | null;
	status: Coupon["status"];
	summary: string;
	type: Coupon["type"];
	usage_limit: number | null;
	used_count: number;
};

type ShippingMethodRow = {
	carrier: string;
	description: string;
	id: string;
	max_delivery_days: number | null;
	min_delivery_days: number | null;
	name: string;
	price: number | string;
	sort_order: number;
	status: ShippingMethod["status"];
};

function deliveryEstimate(row: ShippingMethodRow) {
	if (row.min_delivery_days === null && row.max_delivery_days === null) {
		return "Not set";
	}

	if (row.min_delivery_days === row.max_delivery_days) {
		return `${row.min_delivery_days} day${row.min_delivery_days === 1 ? "" : "s"}`;
	}

	return `${row.min_delivery_days ?? "?"}-${row.max_delivery_days ?? "?"} days`;
}

type ReviewRow = {
	customer_name: string;
	id: string;
	product_name: string;
	rating: number;
	review: string;
	status: ProductReview["status"];
};

type TicketRow = {
	assignee: string;
	customer_name: string;
	email: string | null;
	id: string;
	message: string;
	phone: string | null;
	priority: SupportTicket["priority"];
	status: SupportTicket["status"];
	ticket_number: string;
	title: string;
};

type StoreSettingsRow = {
	address: string;
	chat_link: string;
	store_name: string;
	support_email: string;
	support_phone: string;
};

type DashboardTotalsRow = {
	customers: number;
	orders: number;
	out_of_stock: number;
	products: number;
	revenue: number | string;
};

type DashboardTopProductRow = {
	amount: number | string;
	image_url: string;
	last_ordered_at: Date | string | null;
	name: string;
	orders: number;
	price: number | string;
	stock: number;
};

type DashboardRecentOrderRow = {
	created_at: Date | string;
	order_number: string;
	payment_status: "paid" | "refunded" | "unpaid";
	product_name: string | null;
	status: string;
	total: number | string;
};

type DashboardTopCategoryRow = {
	label: string;
	revenue: number | string;
};

type AppUserRow = {
	created_at: Date | string;
	email: string;
	id: string;
	name: string;
	role: AdminUser["role"];
	status: AdminUser["status"];
	updated_at: Date | string;
};

// Never includes password_hash - this is the shape returned to the admin UI.
export type AdminUser = {
	createdAt: string;
	email: string;
	id: string;
	name: string;
	role: "admin" | "customer" | "manager" | "support";
	status: "active" | "disabled" | "review";
	updatedAt: string;
};

export type ProductReviewWithId = ProductReview & { id: string };
export type SupportTicketWithId = SupportTicket & { id: string };
export type AttributeWithId = Attribute & { id: string };

export type SalesSeries = { categories: string[]; data: number[] };

/** The platform at a glance - every number comes straight from the database. */
export type DashboardOverview = {
	sales30: number;
	salesPrev30: number;
	orders30: number;
	ordersPrev30: number;
	customers: number;
	customersNew30: number;
	stores: number;
	storesNew7: number;
	storesActive: number;
	storesUnpaid: number;
	storesSuspended: number;
	subsTrialing: number;
	subsActive: number;
	subsPastDue: number;
	plans: { count: number; plan: string }[];
	platformFees: number;
	earningsPending: number;
	payoutsRequested: number;
	payoutsRequestedCount: number;
	ordersPending: number;
	ticketsOpen: number;
	outOfStock: number;
};

export type AdminDashboardData = {
	overview: DashboardOverview;
	categories: { image: string; label: string }[];
	/** Order value over time (failed / cancelled / refunded left out). */
	sales: { month: SalesSeries; year: SalesSeries };
	recentOrders: {
		date: string;
		id: string;
		name: string;
		payment: string;
		paymentClass: string;
		price: string;
		status: string;
		statusClass: string;
	}[];
	stats: {
		accentBorder: string;
		badge: string;
		badgeClass: string;
		icon: string;
		iconClass: string;
		label: string;
		value: string;
	}[];
	topCategories: {
		colorClass: string;
		label: string;
		percent: number;
		value: string;
	}[];
	topProducts: {
		amount: string;
		date: string;
		image: string;
		name: string;
		orders: string;
		price: string;
		stock: string;
	}[];
	transactions: {
		amount: string;
		amountClass: string;
		icon: string;
		iconClass: string;
		label: string;
		meta: string;
	}[];
};

function assertAdminResource(resource: string): asserts resource is AdminResource {
	if (!adminResourceSet.has(resource)) {
		throw new HttpError(404, "Unknown admin resource.", "RESOURCE_NOT_FOUND");
	}
}

function money(value: number | string) {
	return new Intl.NumberFormat("en-US", {
		currency: "USD",
		maximumFractionDigits: 0,
		style: "currency",
	}).format(Number(value));
}

function moneyWithCents(value: number | string) {
	return new Intl.NumberFormat("en-US", {
		currency: "USD",
		minimumFractionDigits: 2,
		style: "currency",
	}).format(Number(value));
}

function dateShort(value: Date | string | null) {
	if (!value) {
		return "Today";
	}

	return new Intl.DateTimeFormat("en-GB", {
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
	}).format(new Date(value));
}

function adminProductStatus(status: AdminProductRow["status"]): ProductStatus {
	return status === "published" || status === "low stock" ? status : "draft";
}

function displayStatus(status: string) {
	return status.charAt(0).toUpperCase() + status.slice(1);
}

function adminOrderStatus(status: string): Order["status"] {
	switch (status) {
		case "cancelled":
		case "completed":
		case "delivering":
		case "failed":
		case "pending":
			return status;
		default:
			return "pending";
	}
}

function orderStatusClass(status: string) {
	if (status === "completed") {
		return "text-success-600";
	}

	if (status === "failed" || status === "cancelled") {
		return "text-danger-500";
	}

	return "text-warning-600";
}

function paymentClass(status: DashboardRecentOrderRow["payment_status"]) {
	if (status === "paid") {
		return "text-success-600";
	}

	if (status === "refunded") {
		return "text-warning-600";
	}

	return "text-danger-500";
}

function couponDiscount(row: CouponRow) {
	if (row.type === "shipping") {
		return "Free shipping";
	}

	if (row.type === "percentage") {
		return `${Number(row.discount_value)}% off`;
	}

	return `${money(row.discount_value)} off`;
}

function couponValidity(row: CouponRow) {
	if (row.starts_at && row.ends_at) {
		return `${dateShort(row.starts_at)} - ${dateShort(row.ends_at)}`;
	}

	if (row.starts_at) {
		return `From ${dateShort(row.starts_at)}`;
	}

	return row.status === "expired" ? "Expired" : "Always active";
}

export async function getAdminProducts(): Promise<AdminProduct[]> {
	const result = await dbQuery<AdminProductRow>(`
		SELECT p.id::text, p.sku, p.name, p.image_url, p.price, p.stock, p.status, c.name AS category_name
		FROM products p
		LEFT JOIN categories c ON c.id = p.category_id
		ORDER BY p.updated_at DESC, p.name ASC
	`);

	return result.rows.map((row) => ({
		category: row.category_name ?? "Uncategorized",
		id: row.id,
		image: row.image_url,
		name: row.name,
		price: Number(row.price),
		sku: row.sku,
		status: adminProductStatus(row.status),
		stock: row.stock,
	}));
}

type AdminProductDetailRow = {
	brand_name: string | null;
	category_id: string | null;
	category_name: string | null;
	color_variants: unknown;
	description: string | null;
	faqs: unknown;
	gallery_image_urls: string[] | null;
	id: string;
	image_url: string;
	key_highlights: string[] | null;
	name: string;
	old_price: number | string | null;
	price: number | string;
	rating: number | string;
	review_count: number;
	short_summary: string | null;
	short_summary_image: string | null;
	short_summary_image_height: number | null;
	short_summary_image_width: number | null;
	sku: string;
	specifications: string | null;
	status: "archived" | ProductStatus;
	stock: number;
	storefront_badge: string | null;
	tags: string[] | null;
	slug: string;
	seo_title: string;
	seo_description: string;
	seo_keywords: string[] | null;
	seo_noindex: boolean;
	image_alts: unknown;
	gtin: string;
	mpn: string;
	color_swatches: string[] | null;
	style_options: string[] | null;
	shipping_messages: string[] | null;
	tax_class: string;
	vat_rate: number | string | null;
	weight_kg: number | string | null;
	width_cm: number | string | null;
	height_cm: number | string | null;
	length_cm: number | string | null;
	variations: unknown;
	review_video_urls: string[] | null;
	version: string;
};

export type AdminProductColorVariant = {
	hex: string;
	imageUrl: string;
	name: string;
};

export type AdminProductFaq = {
	answer: string;
	question: string;
};

export type AdminProductDetail = {
	averageRating: number;
	brandName: string;
	categoryId: string;
	categoryName: string;
	colorVariants: AdminProductColorVariant[];
	description: string;
	faqs: AdminProductFaq[];
	id: string;
	images: string[];
	imageUrl: string;
	keyHighlights: string[];
	name: string;
	oldPrice: number | null;
	price: number;
	productBadges: string;
	reviewCount: number;
	shortSummary: string;
	shortSummaryImage: string;
	shortSummaryImageHeight: number | null;
	shortSummaryImageWidth: number | null;
	sku: string;
	specifications: string;
	status: "archived" | ProductStatus;
	stock: number;
	tags: string[];
	// Search engine settings (SEO tab).
	gtin: string;
	imageAlts: Record<string, string>;
	mpn: string;
	seoDescription: string;
	seoKeywords: string[];
	seoNoindex: boolean;
	seoTitle: string;
	slug: string;
	// Buy box options (storefront filter_color / filter_sizes / services).
	colorSwatches: string[];
	shippingMessages: string[];
	styleOptions: string[];
	taxClass: "reduced" | "standard" | "zero";
	vatRate: number | null;
	weightKg: number | null;
	widthCm: number | null;
	heightCm: number | null;
	lengthCm: number | null;
	variations: AdminProductVariation[];
	reviewVideoUrls: string[];
	// Opaque row version for optimistic concurrency - sent back on save.
	version: string;
};

export type AdminProductVariation = {
	attribute: string;
	value: string;
};

function nullableNumber(value: number | string | null) {
	return value === null ? null : Number(value);
}

function adminVariationsValue(value: unknown): AdminProductVariation[] {
	if (!Array.isArray(value)) return [];
	return value.flatMap((item) =>
		item &&
		typeof item === "object" &&
		typeof (item as AdminProductVariation).attribute === "string" &&
		typeof (item as AdminProductVariation).value === "string"
			? [{ attribute: (item as AdminProductVariation).attribute, value: (item as AdminProductVariation).value }]
			: [],
	);
}

// The admin form works in friendly field names (name/hex/imageUrl); storage
// (and the storefront's ColorVariant type) uses color/src/tooltip, matching
// the convention already established by the static demo catalogs and
// ProductCard14 (color = the CSS/hex value, tooltip = the human-readable
// name). Converting here keeps that storage shape untouched while the admin
// UI stays self-explanatory.
function adminColorVariantsValue(value: unknown): AdminProductColorVariant[] {
	if (!Array.isArray(value)) {
		return [];
	}

	return value.flatMap((item) => {
		if (
			!item ||
			typeof item !== "object" ||
			typeof (item as { color?: unknown }).color !== "string" ||
			typeof (item as { src?: unknown }).src !== "string"
		) {
			return [];
		}

		const { color, src, tooltip } = item as {
			color: string;
			src: string;
			tooltip?: unknown;
		};

		return [
			{
				hex: color,
				imageUrl: src,
				name: typeof tooltip === "string" && tooltip ? tooltip : color,
			},
		];
	});
}

function adminFaqsValue(value: unknown): AdminProductFaq[] {
	if (!Array.isArray(value)) {
		return [];
	}

	return value.flatMap((item) => {
		if (
			!item ||
			typeof item !== "object" ||
			typeof (item as { question?: unknown }).question !== "string" ||
			typeof (item as { answer?: unknown }).answer !== "string"
		) {
			return [];
		}

		const { question, answer } = item as { question: string; answer: string };
		return [{ answer, question }];
	});
}

// Powers the real edit form (app/admin/(dashboard)/products/[sku]/edit) -
// the list row shape above doesn't carry enough fields to pre-fill it.
export async function getAdminProductBySku(
	sku: string,
): Promise<AdminProductDetail | null> {
	const result = await dbQuery<AdminProductDetailRow>(
		`
			SELECT p.id::text, p.sku, p.name, p.description, p.price, p.old_price,
				p.stock, p.status, p.image_url, p.gallery_image_urls, p.tags,
				p.color_variants, p.specifications, p.short_summary,
				p.short_summary_image, p.short_summary_image_width,
				p.short_summary_image_height, p.key_highlights, p.faqs,
				p.storefront_badge, p.rating, p.review_count,
				p.category_id::text, c.name AS category_name, b.name AS brand_name,
				p.slug, p.seo_title, p.seo_description, p.seo_keywords,
				p.seo_noindex, p.image_alts, p.gtin, p.mpn,
				p.filter_color AS color_swatches, p.filter_sizes AS style_options,
				p.services AS shipping_messages, p.tax_class, p.vat_rate,
				p.weight_kg, p.width_cm, p.height_cm, p.length_cm, p.variations,
				p.review_video_urls,
				${productVersionSql("p")} AS version
			FROM products p
			LEFT JOIN categories c ON c.id = p.category_id
			LEFT JOIN brands b ON b.id = p.brand_id
			WHERE p.sku = $1
			LIMIT 1
		`,
		[sku],
	);
	const row = result.rows[0];

	if (!row) {
		return null;
	}

	// Older rows predate gallery_image_urls (backfilled by migration 003,
	// but a row inserted before that ran could still be empty) - fall back
	// to the single image_url so the gallery UI always has at least the
	// current thumbnail to show.
	const images = row.gallery_image_urls?.length
		? row.gallery_image_urls
		: [row.image_url].filter(Boolean);

	return {
		averageRating: Number(row.rating),
		brandName: row.brand_name ?? "",
		categoryId: row.category_id ?? "",
		categoryName: row.category_name ?? "",
		colorVariants: adminColorVariantsValue(row.color_variants),
		description: row.description ?? "",
		faqs: adminFaqsValue(row.faqs),
		id: row.id,
		images,
		imageUrl: row.image_url,
		keyHighlights: row.key_highlights ?? [],
		name: row.name,
		oldPrice: row.old_price === null ? null : Number(row.old_price),
		price: Number(row.price),
		productBadges: row.storefront_badge ?? "",
		reviewCount: row.review_count,
		shortSummary: row.short_summary ?? "",
		shortSummaryImage: row.short_summary_image ?? "",
		shortSummaryImageHeight: row.short_summary_image_height,
		shortSummaryImageWidth: row.short_summary_image_width,
		sku: row.sku,
		specifications: row.specifications ?? "",
		status: row.status,
		stock: row.stock,
		tags: row.tags ?? [],
		gtin: row.gtin ?? "",
		imageAlts: parseImageAlts(row.image_alts),
		mpn: row.mpn ?? "",
		seoDescription: row.seo_description ?? "",
		seoKeywords: row.seo_keywords ?? [],
		seoNoindex: Boolean(row.seo_noindex),
		seoTitle: row.seo_title ?? "",
		slug: row.slug,
		colorSwatches: row.color_swatches ?? [],
		shippingMessages: row.shipping_messages ?? [],
		styleOptions: row.style_options ?? [],
		taxClass: (["reduced", "standard", "zero"].includes(row.tax_class)
			? row.tax_class
			: "standard") as AdminProductDetail["taxClass"],
		vatRate: nullableNumber(row.vat_rate),
		weightKg: nullableNumber(row.weight_kg),
		widthCm: nullableNumber(row.width_cm),
		heightCm: nullableNumber(row.height_cm),
		lengthCm: nullableNumber(row.length_cm),
		variations: adminVariationsValue(row.variations),
		reviewVideoUrls: row.review_video_urls ?? [],
		version: row.version,
	};
}

/**
 * A product's edit version: a hash of everything the admin form edits.
 * Columns that change on their own while the form is open - stock (checkout
 * decrements it), the review-derived rating/review_count, and updated_at -
 * are left out, so a sale or a new review never flags an admin's save as a
 * conflict.
 */
export function productVersionSql(alias: string) {
	return `md5((to_jsonb(${alias}) - ARRAY['stock', 'rating', 'review_count', 'updated_at'])::text)`;
}

export type AdminProductLiveState = {
	sales: {
		// Last 7 days, oldest first, in the database's calendar days.
		days: { date: string; revenue: number; units: number }[];
		previousRevenue: number;
		revenue: number;
		units: number;
	};
	stock: number;
	status: AdminProductDetail["status"];
	updatedAt: string;
	version: string;
};

/**
 * What the open edit page watches live: the row version (to spot edits made
 * elsewhere) plus this product's recent sales. Null once the product is gone.
 */
export async function getAdminProductLiveState(
	productId: string,
): Promise<AdminProductLiveState | null> {
	const product = await dbQuery<{
		status: AdminProductDetail["status"];
		stock: number;
		updated_at: Date;
		version: string;
	}>(
		`
			SELECT p.status, p.stock, p.updated_at, ${productVersionSql("p")} AS version
			FROM products p
			WHERE p.id::text = $1
		`,
		[productId],
	);
	const row = product.rows[0];
	if (!row) return null;

	// Cancelled and failed orders never turned into sales.
	const sales = await dbQuery<{ day: string; revenue: string; units: number }>(
		`
			SELECT to_char(d.day, 'YYYY-MM-DD') AS day,
				COALESCE(SUM(oi.qty * oi.unit_price), 0)::text AS revenue,
				COALESCE(SUM(oi.qty), 0)::int AS units
			FROM generate_series(current_date - 13, current_date, interval '1 day') AS d(day)
			LEFT JOIN order_items oi
				ON oi.product_id::text = $1
				AND oi.created_at >= d.day
				AND oi.created_at < d.day + interval '1 day'
				AND EXISTS (
					SELECT 1 FROM orders o
					WHERE o.id = oi.order_id AND o.status NOT IN ('cancelled', 'failed')
				)
			GROUP BY d.day
			ORDER BY d.day
		`,
		[productId],
	);
	const days = sales.rows.map((day) => ({
		date: day.day,
		revenue: Number(day.revenue),
		units: day.units,
	}));
	const current = days.slice(7);
	const sum = (list: typeof days, key: "revenue" | "units") =>
		list.reduce((total, day) => total + day[key], 0);

	return {
		sales: {
			days: current,
			previousRevenue: sum(days.slice(0, 7), "revenue"),
			revenue: sum(current, "revenue"),
			units: sum(current, "units"),
		},
		status: row.status,
		stock: row.stock,
		updatedAt: row.updated_at.toISOString(),
		version: row.version,
	};
}

export async function getAdminCategories(): Promise<Category[]> {
	const result = await dbQuery<CategoryRow>(`
		SELECT c.id::text, c.name, c.slug, c.image_url, c.status, c.sort_order,
			COUNT(p.id)::int AS count
		FROM categories c
		LEFT JOIN products p ON p.category_id = c.id
		GROUP BY c.id
		ORDER BY c.sort_order ASC, lower(c.name) ASC, c.id ASC
	`);

	return result.rows.map((row) => ({
		count: row.count,
		id: row.id,
		image: row.image_url,
		name: row.name,
		slug: row.slug,
		sortOrder: row.sort_order,
		status: row.status,
	}));
}

type CategoryMeta = {
	keywords?: string;
	template?: string;
	title?: string;
};

type AdminCategoryDetailRow = {
	count: number;
	description: string | null;
	id: string;
	image_url: string;
	meta: CategoryMeta | null;
	name: string;
	slug: string;
	sort_order: number;
	status: Category["status"];
};

export type AdminCategoryDetail = {
	description: string;
	id: string;
	imageUrl: string;
	metaKeywords: string;
	metaTitle: string;
	name: string;
	productCount: number;
	slug: string;
	sortOrder: number;
	status: Category["status"];
	template: string;
};

// mutateCategory has no separate meta.description - it reuses the main
// `description` column as the fallback when the SEO tab's meta_description
// field is left blank, so both fields pre-fill from the same real value.
export async function getAdminCategoryBySlug(
	slug: string,
): Promise<AdminCategoryDetail | null> {
	const result = await dbQuery<AdminCategoryDetailRow>(
		`
			SELECT c.id::text, c.name, c.slug, c.description, c.status, c.image_url,
				c.meta, c.sort_order,
				COUNT(p.id)::int AS count
			FROM categories c
			LEFT JOIN products p ON p.category_id = c.id
			WHERE c.slug = $1
			GROUP BY c.id
			LIMIT 1
		`,
		[slug],
	);
	const row = result.rows[0];

	if (!row) {
		return null;
	}

	const meta = row.meta ?? {};

	return {
		description: row.description ?? "",
		id: row.id,
		imageUrl: row.image_url,
		metaKeywords: meta.keywords ?? "",
		metaTitle: meta.title ?? "",
		name: row.name,
		productCount: row.count,
		slug: row.slug,
		sortOrder: row.sort_order,
		status: row.status,
		template: meta.template ?? "",
	};
}

export async function getAdminBrands(): Promise<Brand[]> {
	const result = await dbQuery<BrandRow>(`
		SELECT b.name, b.slug, b.website, b.initials, b.visibility, b.status, b.tile_class, COUNT(p.id)::int AS count
		FROM brands b
		LEFT JOIN products p ON p.brand_id = b.id
		GROUP BY b.id
		ORDER BY b.name ASC
	`);

	return result.rows.map((row) => ({
		count: row.count,
		initials: row.initials,
		name: row.name,
		slug: row.slug,
		status: row.status,
		tileClass: row.tile_class,
		visibility: row.visibility,
		website: row.website,
	}));
}

type BrandMeta = {
	country?: string;
	description?: string;
	keywords?: string;
	supportEmail?: string;
	title?: string;
	vendorCode?: string;
};

type AdminBrandDetailRow = {
	count: number;
	description: string | null;
	meta: BrandMeta | null;
	name: string;
	slug: string;
	status: Brand["status"];
	visibility: Brand["visibility"];
	website: string | null;
};

export type AdminBrandDetail = {
	country: string;
	description: string;
	metaDescription: string;
	metaKeywords: string;
	metaTitle: string;
	name: string;
	productCount: number;
	slug: string;
	status: Brand["status"];
	supportEmail: string;
	vendorCode: string;
	visibility: Brand["visibility"];
	website: string;
};

export async function getAdminBrandBySlug(
	slug: string,
): Promise<AdminBrandDetail | null> {
	const result = await dbQuery<AdminBrandDetailRow>(
		`
			SELECT b.name, b.slug, b.website, b.visibility, b.status, b.description,
				b.meta, COUNT(p.id)::int AS count
			FROM brands b
			LEFT JOIN products p ON p.brand_id = b.id
			WHERE b.slug = $1
			GROUP BY b.id
			LIMIT 1
		`,
		[slug],
	);
	const row = result.rows[0];

	if (!row) {
		return null;
	}

	const meta = row.meta ?? {};

	return {
		country: meta.country ?? "",
		description: row.description ?? "",
		metaDescription: meta.description ?? "",
		metaKeywords: meta.keywords ?? "",
		metaTitle: meta.title ?? "",
		name: row.name,
		productCount: row.count,
		slug: row.slug,
		status: row.status,
		supportEmail: meta.supportEmail ?? "",
		vendorCode: meta.vendorCode ?? "",
		visibility: row.visibility,
		website: row.website ?? "",
	};
}

export async function getAdminAttributes(): Promise<AttributeWithId[]> {
	const result = await dbQuery<AttributeRow>(`
		SELECT id::text, name, type, values, status, products_count
		FROM product_attributes
		ORDER BY name ASC
	`);

	return result.rows.map((row) => ({
		id: row.id,
		name: row.name,
		products: row.products_count,
		status: row.status,
		type: row.type,
		values: row.values ?? [],
	}));
}

export async function getAdminCustomers(): Promise<Customer[]> {
	const result = await dbQuery<CustomerRow>(`
		SELECT
			c.name,
			c.email,
			c.segment,
			c.status,
			c.avatar_class,
			COUNT(o.id)::int AS orders,
			COALESCE(SUM(o.total), 0) AS ltv
		FROM customers c
		LEFT JOIN orders o ON o.customer_id = c.id
		GROUP BY c.id
		ORDER BY c.updated_at DESC, c.name ASC
	`);

	return result.rows.map((row) => ({
		avatarClass: row.avatar_class,
		email: row.email,
		ltv: money(row.ltv),
		name: row.name,
		orders: row.orders,
		segment: row.segment,
		status: row.status,
	}));
}

export async function getAdminUsers(): Promise<AdminUser[]> {
	const result = await dbQuery<AppUserRow>(`
		SELECT id::text, name, email, role, status, created_at, updated_at
		FROM app_users
		ORDER BY created_at DESC
	`);

	return result.rows.map((row) => ({
		createdAt: dateShort(row.created_at),
		email: row.email,
		id: row.id,
		name: row.name,
		role: row.role,
		status: row.status,
		updatedAt: dateShort(row.updated_at),
	}));
}

export async function getAdminOrders(): Promise<Order[]> {
	const result = await dbQuery<OrderRow>(`
		SELECT order_number, customer_name, status, total, created_at, updated_at
		FROM orders
		ORDER BY created_at DESC
	`);

	return result.rows.map((row) => ({
		added: dateShort(row.created_at),
		customer: row.customer_name,
		id: row.order_number,
		modified: dateShort(row.updated_at),
		status: adminOrderStatus(row.status),
		total: moneyWithCents(row.total),
	}));
}

type OrderAddress = {
	address1?: string;
	address2?: string;
	city?: string;
	country?: string;
	postcode?: string;
	state?: string;
};

type AdminOrderDetailRow = {
	billing_address: OrderAddress | null;
	created_at: Date | string;
	customer_email: string | null;
	customer_name: string;
	id: string;
	order_number: string;
	payment_method: string | null;
	payment_status: "paid" | "refunded" | "unpaid";
	shipping_address: OrderAddress | null;
	shipping_cost: number | string;
	shipping_method_name: string | null;
	status: Order["status"];
	total: number | string;
};

type AdminOrderItemRow = {
	image_url: string | null;
	product_name: string;
	qty: number;
	sku: string;
	unit_price: number | string;
};

export type AdminOrderDetail = {
	billingAddress: OrderAddress;
	createdAt: string;
	customerEmail: string;
	customerName: string;
	items: {
		image: string;
		name: string;
		qty: number;
		sku: string;
		total: number;
		unitPrice: number;
	}[];
	orderNumber: string;
	paymentMethod: string;
	paymentStatus: "paid" | "refunded" | "unpaid";
	shippingAddress: OrderAddress;
	shippingCost: number;
	shippingMethodName: string;
	status: Order["status"];
	subtotal: number;
	total: number;
};

export async function getAdminOrderByNumber(
	orderNumber: string,
): Promise<AdminOrderDetail | null> {
	const orderResult = await dbQuery<AdminOrderDetailRow>(
		`
			SELECT id::text, order_number, customer_name, customer_email, status,
				payment_status, payment_method, total, billing_address, shipping_address,
				shipping_method_name, shipping_cost, created_at
			FROM orders
			WHERE order_number = $1
			LIMIT 1
		`,
		[orderNumber],
	);
	const order = orderResult.rows[0];

	if (!order) {
		return null;
	}

	const itemsResult = await dbQuery<AdminOrderItemRow>(
		`
			SELECT sku, product_name, image_url, qty, unit_price
			FROM order_items
			WHERE order_id = $1
			ORDER BY created_at ASC
		`,
		[order.id],
	);

	return {
		billingAddress: order.billing_address ?? {},
		createdAt: dateShort(order.created_at),
		customerEmail: order.customer_email ?? "",
		customerName: order.customer_name,
		items: itemsResult.rows.map((item) => ({
			image: item.image_url ?? "",
			name: item.product_name,
			qty: item.qty,
			sku: item.sku,
			total: Number(item.unit_price) * item.qty,
			unitPrice: Number(item.unit_price),
		})),
		orderNumber: order.order_number,
		paymentMethod: order.payment_method ?? "",
		paymentStatus: order.payment_status,
		shippingAddress: order.shipping_address ?? {},
		shippingCost: Number(order.shipping_cost),
		shippingMethodName: order.shipping_method_name || "Not set",
		status: order.status,
		subtotal: Number(order.total) - Number(order.shipping_cost),
		total: Number(order.total),
	};
}

export async function getAdminShippingMethods(): Promise<ShippingMethod[]> {
	const result = await dbQuery<ShippingMethodRow>(`
		SELECT id::text, name, description, carrier, price, min_delivery_days,
			max_delivery_days, status, sort_order
		FROM shipping_methods
		ORDER BY sort_order ASC, name ASC
	`);

	return result.rows.map((row) => ({
		carrier: row.carrier,
		deliveryEstimate: deliveryEstimate(row),
		description: row.description,
		id: row.id,
		name: row.name,
		price: Number(row.price),
		sortOrder: row.sort_order,
		status: row.status,
	}));
}

export type AdminShippingMethodDetail = ShippingMethod & {
	maxDeliveryDays: number | null;
	minDeliveryDays: number | null;
};

export async function getAdminShippingMethodByName(
	name: string,
): Promise<AdminShippingMethodDetail | null> {
	const result = await dbQuery<ShippingMethodRow>(
		`
			SELECT id::text, name, description, carrier, price, min_delivery_days,
				max_delivery_days, status, sort_order
			FROM shipping_methods
			WHERE name = $1
			LIMIT 1
		`,
		[name],
	);
	const row = result.rows[0];

	if (!row) {
		return null;
	}

	return {
		carrier: row.carrier,
		deliveryEstimate: deliveryEstimate(row),
		description: row.description,
		id: row.id,
		maxDeliveryDays: row.max_delivery_days,
		minDeliveryDays: row.min_delivery_days,
		name: row.name,
		price: Number(row.price),
		sortOrder: row.sort_order,
		status: row.status,
	};
}

type AdvertisementRow = {
	id: string;
	title: string;
	image_url: string;
	link_url: string;
	sort_order: number;
	status: Advertisement["status"];
};

function toAdvertisement(row: AdvertisementRow): Advertisement {
	return {
		id: row.id,
		imageUrl: row.image_url,
		linkUrl: row.link_url,
		sortOrder: row.sort_order,
		status: row.status,
		title: row.title,
	};
}

export async function getAdminAdvertisements(): Promise<Advertisement[]> {
	const result = await dbQuery<AdvertisementRow>(`
		SELECT id::text, title, image_url, link_url, status, sort_order
		FROM advertisements
		ORDER BY sort_order ASC, title ASC
	`);

	return result.rows.map(toAdvertisement);
}

export async function getAdminAdvertisementByTitle(
	title: string,
): Promise<Advertisement | null> {
	const result = await dbQuery<AdvertisementRow>(
		`
			SELECT id::text, title, image_url, link_url, status, sort_order
			FROM advertisements
			WHERE title = $1
			LIMIT 1
		`,
		[title],
	);
	const row = result.rows[0];

	return row ? toAdvertisement(row) : null;
}

export async function getAdminCoupons(): Promise<Coupon[]> {
	const result = await dbQuery<CouponRow>(`
		SELECT
			code, name, summary, type, discount_value, usage_limit, used_count,
			status, starts_at, ends_at, icon_class
		FROM coupons
		ORDER BY updated_at DESC, name ASC
	`);

	return result.rows.map((row) => ({
		code: row.code,
		discount: couponDiscount(row),
		iconClass: row.icon_class,
		name: row.name,
		status: row.status,
		summary: row.summary,
		type: row.type,
		used: row.usage_limit
			? `${row.used_count.toLocaleString("en-US")} / ${row.usage_limit.toLocaleString("en-US")}`
			: row.used_count.toLocaleString("en-US"),
		validity: couponValidity(row),
	}));
}

type AdminCouponDetailRow = {
	code: string;
	discount_value: number | string;
	ends_at: Date | string | null;
	maximum_discount: number | string | null;
	minimum_order: number | string | null;
	name: string;
	starts_at: Date | string | null;
	status: Coupon["status"];
	summary: string | null;
	type: Coupon["type"];
	usage_limit: number | null;
	used_count: number;
};

export type AdminCouponDetail = {
	code: string;
	discountValue: number;
	endDate: string;
	maximumDiscount: number | null;
	minimumOrder: number;
	name: string;
	startDate: string;
	status: Coupon["status"];
	summary: string;
	type: Coupon["type"];
	usageLimit: number | null;
	usedCount: number;
};

function isoDate(value: Date | string | null) {
	if (!value) {
		return "";
	}

	return new Date(value).toISOString().slice(0, 10);
}

export async function getAdminCouponByCode(
	code: string,
): Promise<AdminCouponDetail | null> {
	const result = await dbQuery<AdminCouponDetailRow>(
		`
			SELECT code, name, summary, type, discount_value, minimum_order,
				maximum_discount, usage_limit, used_count, status, starts_at, ends_at
			FROM coupons
			WHERE code = $1
			LIMIT 1
		`,
		[code],
	);
	const row = result.rows[0];

	if (!row) {
		return null;
	}

	return {
		code: row.code,
		discountValue: Number(row.discount_value),
		endDate: isoDate(row.ends_at),
		maximumDiscount:
			row.maximum_discount === null ? null : Number(row.maximum_discount),
		minimumOrder: Number(row.minimum_order ?? 0),
		name: row.name,
		startDate: isoDate(row.starts_at),
		status: row.status,
		summary: row.summary ?? "",
		type: row.type,
		usageLimit: row.usage_limit,
		usedCount: row.used_count,
	};
}

export async function getAdminReviews(): Promise<ProductReviewWithId[]> {
	const result = await dbQuery<ReviewRow>(`
		SELECT id::text, product_name, customer_name, rating, review, status
		FROM product_reviews
		ORDER BY created_at DESC
	`);

	return result.rows.map((row) => ({
		customer: row.customer_name,
		id: row.id,
		product: row.product_name,
		rating: row.rating,
		review: row.review,
		status: row.status,
	}));
}

type AdminProductReviewRow = {
	created_at: Date | string;
	customer_name: string;
	id: string;
	rating: number;
	review: string;
	status: ProductReview["status"];
};

export type AdminProductReview = {
	createdAt: string;
	customerName: string;
	id: string;
	rating: number;
	review: string;
	status: ProductReview["status"];
};

export async function getAdminProductReviews(
	productId: string,
): Promise<AdminProductReview[]> {
	const result = await dbQuery<AdminProductReviewRow>(
		`
			SELECT id::text, customer_name, rating, review, status, created_at
			FROM product_reviews
			WHERE product_id = $1
			ORDER BY created_at DESC
		`,
		[productId],
	);

	return result.rows.map((row) => ({
		createdAt: dateShort(row.created_at),
		customerName: row.customer_name,
		id: row.id,
		rating: row.rating,
		review: row.review,
		status: row.status,
	}));
}

export async function getAdminSupportTickets(): Promise<SupportTicketWithId[]> {
	const result = await dbQuery<TicketRow>(`
		SELECT id::text, ticket_number, title, customer_name, priority, status, assignee, email, phone, message
		FROM support_tickets
		ORDER BY created_at DESC
	`);

	return result.rows.map((row) => ({
		assignee: row.assignee,
		customer: row.customer_name,
		email: row.email ?? "",
		id: row.id,
		message: row.message,
		phone: row.phone ?? "",
		priority: row.priority,
		status: row.status,
		title: row.title || `#${row.ticket_number}`,
	}));
}

export type AdminStoreSettings = {
	address: string;
	chatLink: string;
	storeName: string;
	supportEmail: string;
	supportPhone: string;
};

export async function getAdminStoreSettings(): Promise<AdminStoreSettings> {
	const result = await dbQuery<StoreSettingsRow>(`
		SELECT store_name, support_email, support_phone, address, chat_link
		FROM store_settings
		WHERE id = 1
	`);
	const row = result.rows[0];

	return {
		address: row?.address ?? "",
		chatLink: row?.chat_link ?? "",
		storeName: row?.store_name ?? "",
		supportEmail: row?.support_email ?? "",
		supportPhone: row?.support_phone ?? "",
	};
}

/** What's waiting on an admin right now - the header bell's list. */
export type AdminAttention = {
	ordersPending: number;
	outOfStock: number;
	payoutsRequested: number;
	payoutsRequestedCount: number;
	subsPastDue: number;
	ticketsOpen: number;
};

export async function getAdminAttention(): Promise<AdminAttention> {
	const result = await dbQuery<Record<keyof AdminAttention, number | string>>(`
		SELECT
			(SELECT COUNT(*)::int FROM orders WHERE status = 'pending') AS "ordersPending",
			(SELECT COUNT(*)::int FROM products WHERE stock <= 0 AND status != 'draft') AS "outOfStock",
			COALESCE((SELECT SUM(amount) FROM reseller_payouts WHERE status = 'requested'), 0) AS "payoutsRequested",
			(SELECT COUNT(*)::int FROM reseller_payouts WHERE status = 'requested') AS "payoutsRequestedCount",
			(SELECT COUNT(*)::int FROM seller_subscriptions WHERE status = 'past_due') AS "subsPastDue",
			(SELECT COUNT(*)::int FROM support_tickets WHERE status IN ('open', 'pending')) AS "ticketsOpen"
	`);
	const row = result.rows[0];
	return {
		ordersPending: Number(row?.ordersPending ?? 0),
		outOfStock: Number(row?.outOfStock ?? 0),
		payoutsRequested: Number(row?.payoutsRequested ?? 0),
		payoutsRequestedCount: Number(row?.payoutsRequestedCount ?? 0),
		subsPastDue: Number(row?.subsPastDue ?? 0),
		ticketsOpen: Number(row?.ticketsOpen ?? 0),
	};
}

export async function getAdminDashboard(): Promise<AdminDashboardData> {
	const [totals, categories, topProducts, recentOrders, topCategories, salesByMonth, salesByWeek, overviewRows, planRows] =
		await Promise.all([
			dbQuery<DashboardTotalsRow>(`
				SELECT
					COALESCE((SELECT SUM(total) FROM orders WHERE status = 'completed'), 0) AS revenue,
					(SELECT COUNT(*)::int FROM orders) AS orders,
					(SELECT COUNT(*)::int FROM products) AS products,
					(SELECT COUNT(*)::int FROM customers) AS customers,
					-- Published/low-stock listings with zero stock still show on the
					-- storefront (browsable, purchase disabled) but are easy to miss
					-- in the products list since their status badge still reads
					-- "Published" - surface the count here so it isn't silently lost.
					(SELECT COUNT(*)::int FROM products WHERE stock <= 0 AND status != 'draft') AS out_of_stock
			`),
			dbQuery<CategoryRow>(`
				SELECT c.name, c.slug, c.image_url, c.status, COUNT(p.id)::int AS count
				FROM categories c
				LEFT JOIN products p ON p.category_id = c.id
				WHERE c.status = 'published'
				GROUP BY c.id
				ORDER BY count DESC, c.name ASC
				LIMIT 12
			`),
			dbQuery<DashboardTopProductRow>(`
				SELECT
					p.name,
					p.image_url,
					p.price,
					p.stock,
					COALESCE(SUM(oi.qty), 0)::int AS orders,
					COALESCE(SUM(oi.qty * oi.unit_price), 0) AS amount,
					MAX(oi.created_at) AS last_ordered_at
				FROM products p
				LEFT JOIN order_items oi ON oi.product_id = p.id
				GROUP BY p.id
				ORDER BY orders DESC, amount DESC, p.updated_at DESC
				LIMIT 5
			`),
			dbQuery<DashboardRecentOrderRow>(`
				SELECT
					o.order_number,
					o.status,
					o.total,
					o.payment_status,
					o.created_at,
					item.product_name
				FROM orders o
				LEFT JOIN LATERAL (
					SELECT product_name
					FROM order_items
					WHERE order_id = o.id
					ORDER BY created_at ASC
					LIMIT 1
				) item ON true
				ORDER BY o.created_at DESC
				LIMIT 6
			`),
			dbQuery<DashboardTopCategoryRow>(`
				SELECT
					COALESCE(c.name, 'Uncategorized') AS label,
					COALESCE(SUM(oi.qty * oi.unit_price), 0) AS revenue
				FROM categories c
				LEFT JOIN products p ON p.category_id = c.id
				LEFT JOIN order_items oi ON oi.product_id = p.id
				GROUP BY c.id, c.name
				ORDER BY revenue DESC, c.name ASC
				LIMIT 5
			`),
			// The last 12 calendar months, oldest first, empty months included.
			dbQuery<{ label: string; total: string }>(`
				SELECT to_char(m.month, 'Mon') AS label, COALESCE(SUM(o.total), 0) AS total
				FROM generate_series(date_trunc('month', now()) - interval '11 months', date_trunc('month', now()), interval '1 month') AS m(month)
				LEFT JOIN orders o
					ON o.created_at >= m.month AND o.created_at < m.month + interval '1 month'
					AND o.status NOT IN ('failed', 'cancelled', 'refunded')
				GROUP BY m.month
				ORDER BY m.month
			`),
			// The last 4 weeks as 7-day windows ending now, oldest first.
			dbQuery<{ label: string; total: string }>(`
				SELECT to_char(w.start, 'Mon DD') AS label, COALESCE(SUM(o.total), 0) AS total
				FROM generate_series(now() - interval '28 days', now() - interval '7 days', interval '7 days') AS w(start)
				LEFT JOIN orders o
					ON o.created_at >= w.start AND o.created_at < w.start + interval '7 days'
					AND o.status NOT IN ('failed', 'cancelled', 'refunded')
				GROUP BY w.start
				ORDER BY w.start
			`),
			// Last 30 days vs the 30 before (failed / cancelled orders aren't sales).
			dbQuery<Record<string, string | number>>(`
				SELECT
					COALESCE((SELECT SUM(total) FROM orders WHERE created_at >= now() - interval '30 days' AND status NOT IN ('failed', 'cancelled')), 0) AS sales30,
					COALESCE((SELECT SUM(total) FROM orders WHERE created_at >= now() - interval '60 days' AND created_at < now() - interval '30 days' AND status NOT IN ('failed', 'cancelled')), 0) AS sales_prev30,
					(SELECT COUNT(*)::int FROM orders WHERE created_at >= now() - interval '30 days') AS orders30,
					(SELECT COUNT(*)::int FROM orders WHERE created_at >= now() - interval '60 days' AND created_at < now() - interval '30 days') AS orders_prev30,
					(SELECT COUNT(*)::int FROM customers) AS customers,
					(SELECT COUNT(*)::int FROM customers WHERE created_at >= now() - interval '30 days') AS customers_new30,
					(SELECT COUNT(*)::int FROM reseller_stores) AS stores,
					(SELECT COUNT(*)::int FROM reseller_stores WHERE created_at >= now() - interval '7 days') AS stores_new7,
					(SELECT COUNT(*)::int FROM reseller_stores WHERE status = 'active') AS stores_active,
					(SELECT COUNT(*)::int FROM reseller_stores WHERE status = 'unpaid') AS stores_unpaid,
					(SELECT COUNT(*)::int FROM reseller_stores WHERE status = 'suspended') AS stores_suspended,
					(SELECT COUNT(*)::int FROM seller_subscriptions WHERE status = 'trialing') AS subs_trialing,
					(SELECT COUNT(*)::int FROM seller_subscriptions WHERE status = 'active') AS subs_active,
					(SELECT COUNT(*)::int FROM seller_subscriptions WHERE status = 'past_due') AS subs_past_due,
					COALESCE((SELECT SUM(platform_fee) FROM reseller_earnings WHERE status <> 'cancelled'), 0) AS platform_fees,
					COALESCE((SELECT SUM(net_amount) FROM reseller_earnings WHERE status = 'pending'), 0) AS earnings_pending,
					COALESCE((SELECT SUM(amount) FROM reseller_payouts WHERE status = 'requested'), 0) AS payouts_requested,
					(SELECT COUNT(*)::int FROM reseller_payouts WHERE status = 'requested') AS payouts_requested_count,
					(SELECT COUNT(*)::int FROM orders WHERE status = 'pending') AS orders_pending,
					(SELECT COUNT(*)::int FROM support_tickets WHERE status IN ('open', 'pending')) AS tickets_open
			`),
			dbQuery<{ count: number; plan: string }>(`
				SELECT plan, COUNT(*)::int AS count
				FROM seller_subscriptions
				WHERE status IN ('trialing', 'active', 'past_due')
				GROUP BY plan
				ORDER BY count DESC
			`),
		]);
	const overview = overviewRows.rows[0];
	const series = (rows: { label: string; total: string }[]): SalesSeries => ({
		categories: rows.map((row) => row.label),
		data: rows.map((row) => Math.round(Number(row.total) * 100) / 100),
	});

	const total = totals.rows[0] ?? {
		customers: 0,
		orders: 0,
		out_of_stock: 0,
		products: 0,
		revenue: 0,
	};
	const categoryRevenue = topCategories.rows.reduce(
		(sum, row) => sum + Number(row.revenue),
		0,
	);
	const colors = [
		"bg-brand-600",
		"bg-admin-teal",
		"bg-accent-500",
		"bg-purple-500",
		"bg-warning-500",
	];

	const n = (key: string) => Number(overview?.[key] ?? 0);
	return {
		overview: {
			customers: n("customers"),
			customersNew30: n("customers_new30"),
			earningsPending: n("earnings_pending"),
			orders30: n("orders30"),
			ordersPending: n("orders_pending"),
			ordersPrev30: n("orders_prev30"),
			outOfStock: Number(total.out_of_stock),
			payoutsRequested: n("payouts_requested"),
			payoutsRequestedCount: n("payouts_requested_count"),
			plans: planRows.rows,
			platformFees: n("platform_fees"),
			sales30: n("sales30"),
			salesPrev30: n("sales_prev30"),
			stores: n("stores"),
			storesActive: n("stores_active"),
			storesNew7: n("stores_new7"),
			storesSuspended: n("stores_suspended"),
			storesUnpaid: n("stores_unpaid"),
			subsActive: n("subs_active"),
			subsPastDue: n("subs_past_due"),
			subsTrialing: n("subs_trialing"),
			ticketsOpen: n("tickets_open"),
		},
		sales: { month: series(salesByWeek.rows), year: series(salesByMonth.rows) },
		categories: categories.rows.map((category) => ({
			image: category.image_url,
			label: category.name,
		})),
		recentOrders: recentOrders.rows.map((order) => ({
			date: dateShort(order.created_at),
			id: `#${order.order_number}`,
			name: order.product_name ?? "Order",
			payment: displayStatus(order.payment_status),
			paymentClass: paymentClass(order.payment_status),
			price: moneyWithCents(order.total),
			status: displayStatus(order.status),
			statusClass: orderStatusClass(order.status),
		})),
		stats: [
			{
				accentBorder: "border-admin-teal",
				badge: "Live",
				badgeClass: "bg-success-50 text-success-600",
				icon: "database",
				iconClass: "bg-success-50 text-admin-teal",
				label: "Total Revenue",
				value: money(total.revenue),
			},
			{
				accentBorder: "border-brand-500",
				badge: "Live",
				badgeClass: "bg-brand-50 text-brand-600",
				icon: "archive",
				iconClass: "bg-brand-50 text-brand-600",
				label: "Total Orders",
				value: total.orders.toLocaleString("en-US"),
			},
			{
				accentBorder: "border-danger-500",
				badge: "Live",
				badgeClass: "bg-danger-50 text-danger-500 uppercase tracking-normal",
				icon: "message-circle",
				iconClass: "bg-danger-50 text-danger-500",
				label: "Total Products",
				value: total.products.toLocaleString("en-US"),
			},
			{
				accentBorder: "border-purple-500",
				badge: "Live",
				badgeClass: "bg-purple-50 text-purple-600",
				icon: "user-plus",
				iconClass: "bg-purple-50 text-purple-600",
				label: "Total Customers",
				value: total.customers.toLocaleString("en-US"),
			},
			{
				accentBorder: "border-danger-500",
				badge: total.out_of_stock > 0 ? "Needs attention" : "All good",
				badgeClass:
					total.out_of_stock > 0
						? "bg-danger-50 text-danger-500"
						: "bg-success-50 text-success-600",
				icon: "circle-alert",
				iconClass: "bg-danger-50 text-danger-500",
				label: "Out of Stock",
				value: total.out_of_stock.toLocaleString("en-US"),
			},
		],
		topCategories: topCategories.rows.map((category, index) => {
			const revenue = Number(category.revenue);
			return {
				colorClass: colors[index % colors.length],
				label: category.label,
				percent: categoryRevenue ? Math.round((revenue / categoryRevenue) * 100) : 0,
				value: money(revenue),
			};
		}),
		topProducts: topProducts.rows.map((product) => ({
			amount: money(product.amount),
			date: dateShort(product.last_ordered_at),
			image: product.image_url,
			name: product.name,
			orders: product.orders.toLocaleString("en-US"),
			price: moneyWithCents(product.price),
			stock: product.stock.toLocaleString("en-US"),
		})),
		transactions: recentOrders.rows.slice(0, 5).map((order) => ({
			amount: moneyWithCents(order.total),
			amountClass:
				order.status === "failed" || order.status === "cancelled"
					? "text-danger-500"
					: "text-success-600",
			icon: order.payment_status === "paid" ? "check" : "credit-card",
			iconClass:
				order.payment_status === "paid"
					? "bg-success-50 text-success-600"
					: "bg-warning-50 text-warning-600",
			label: `Order #${order.order_number}`,
			meta: displayStatus(order.payment_status),
		})),
	};
}

export async function getAdminResource(resource: string) {
	assertAdminResource(resource);

	switch (resource) {
		case "advertisements":
			return getAdminAdvertisements();
		case "attributes":
			return getAdminAttributes();
		case "brands":
			return getAdminBrands();
		case "categories":
			return getAdminCategories();
		case "coupons":
			return getAdminCoupons();
		case "customers":
			return getAdminCustomers();
		case "attention":
			return getAdminAttention();
		case "dashboard":
			return getAdminDashboard();
		case "orders":
			return getAdminOrders();
		case "products":
			return getAdminProducts();
		case "reviews":
			return getAdminReviews();
		case "shipping-methods":
			return getAdminShippingMethods();
		case "store-settings":
			return getAdminStoreSettings();
		case "support-tickets":
			return getAdminSupportTickets();
		case "users":
			return getAdminUsers();
	}
}

export async function deleteAdminResource(resource: string, ids: string[]) {
	assertAdminResource(resource);

	if (resource === "dashboard") {
		throw new HttpError(405, "Dashboard is read-only.", "METHOD_NOT_ALLOWED");
	}

	if (!ids.length) {
		return { deleted: 0 };
	}

	const deleteQueries: Partial<Record<AdminResource, string>> = {
		advertisements: "DELETE FROM advertisements WHERE id = ANY($1::uuid[])",
		attributes: "DELETE FROM product_attributes WHERE id = ANY($1::uuid[])",
		brands: "DELETE FROM brands WHERE slug = ANY($1::text[])",
		categories: "DELETE FROM categories WHERE slug = ANY($1::text[])",
		coupons: "DELETE FROM coupons WHERE code = ANY($1::text[])",
		customers: "DELETE FROM customers WHERE email = ANY($1::text[])",
		orders: "DELETE FROM orders WHERE order_number = ANY($1::text[])",
		products: "DELETE FROM products WHERE sku = ANY($1::text[])",
		reviews: "DELETE FROM product_reviews WHERE id = ANY($1::uuid[])",
		"shipping-methods": "DELETE FROM shipping_methods WHERE id = ANY($1::uuid[])",
		"support-tickets": "DELETE FROM support_tickets WHERE id = ANY($1::uuid[])",
		users: "DELETE FROM app_users WHERE id = ANY($1::uuid[])",
	};

	const query = deleteQueries[resource];

	if (!query) {
		throw new HttpError(405, "Resource does not support deletes.", "METHOD_NOT_ALLOWED");
	}

	const result = await dbQuery(query, [ids]);
	return { deleted: result.rowCount ?? 0 };
}

/** Who can reach the admin (Settings -> Permissions). Only active "admin" accounts can sign in. */
export type AdminAccount = { canSignIn: boolean; createdAt: string; email: string; name: string; role: string; status: string };

export async function getAdminAccounts(): Promise<AdminAccount[]> {
	const result = await dbQuery<{ created_at: Date; email: string; name: string; role: string; status: string }>(
		"SELECT name, email, role, status, created_at FROM app_users ORDER BY (role = 'admin') DESC, created_at ASC",
	);
	return result.rows.map((row) => ({
		canSignIn: row.role === "admin" && row.status === "active",
		createdAt: row.created_at.toISOString(),
		email: row.email,
		name: row.name,
		role: row.role,
		status: row.status,
	}));
}
