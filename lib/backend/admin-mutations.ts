import bcrypt from "bcryptjs";
import { z } from "zod";
import { productVersionSql, type AdminUser } from "@/lib/backend/admin-data";
import type { PoolClient, QueryResult, QueryResultRow } from "pg";
import { dbQuery, withTransaction } from "@/lib/backend/db";
import { HttpError } from "@/lib/backend/http";
import { syncProductRatingSummary } from "@/lib/backend/product-ratings";
import { computePricing, type DiscountType } from "@/lib/productPricing";
import {
	isValidGtin,
	normalizeGtin,
	parseImageAlts,
	parseKeywords,
	SEO_SLUG_MAX,
	slugifyHandle,
} from "@/lib/productSeoFields";

// Matches the cost factor scripts/db-seed.mjs uses for the bootstrap admin.
const BCRYPT_COST = 12;

type MutationMode = "create" | "update";
type FormRecord = Record<string, unknown>;

const mutationResources = new Set([
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
	"store-settings",
	"support-tickets",
	"users",
]);

const genericPayloadSchema = z.record(z.string(), z.unknown());

function assertMutationResource(resource: string) {
	if (!mutationResources.has(resource)) {
		throw new HttpError(404, "Unknown admin resource.", "RESOURCE_NOT_FOUND");
	}
}

function firstString(input: FormRecord, keys: string[], fallback = "") {
	for (const key of keys) {
		const value = input[key];

		if (Array.isArray(value)) {
			const match = value.find(
				(item) => typeof item === "string" && item.trim(),
			);

			if (typeof match === "string") {
				return match.trim();
			}
		}

		if (typeof value === "string" && value.trim()) {
			return value.trim();
		}
	}

	return fallback;
}

function numberValue(input: FormRecord, keys: string[], fallback = 0) {
	const raw = firstString(input, keys);
	const next = Number(raw);
	return Number.isFinite(next) ? next : fallback;
}

function arrayValue(input: FormRecord, keys: string[]) {
	const values: string[] = [];

	for (const key of keys) {
		const value = input[key];

		if (Array.isArray(value)) {
			values.push(
				...value
					.filter((item): item is string => typeof item === "string")
					.flatMap((item) => item.split(",")),
			);
		} else if (typeof value === "string") {
			values.push(...value.split(","));
		}
	}

	return [...new Set(values.map((item) => item.trim()).filter(Boolean))];
}

// Key Highlights' own help text/placeholder documents semicolon-separated
// entries (a highlight bullet can legitimately contain a comma, e.g.
// "Machine washable, tumble dry low") - arrayValue's comma split would
// wrongly break a single highlight into multiple rows, so this needs its
// own delimiter instead of reusing arrayValue.
function semicolonArrayValue(input: FormRecord, keys: string[]) {
	const values: string[] = [];

	for (const key of keys) {
		const value = input[key];

		if (typeof value === "string") {
			values.push(...value.split(";"));
		}
	}

	return [...new Set(values.map((item) => item.trim()).filter(Boolean))];
}

// Admin's color-variants field posts one hidden input holding a JSON-encoded
// array of {name, hex, imageUrl} rows (see color-variants-field.tsx) - not a
// comma-separated list like the other array fields here, since each row is a
// structured object rather than a single string. Stored (and read back on
// the storefront) as {color, src, tooltip}, matching the convention already
// used by the static demo catalogs and ProductCard14 (color = the CSS/hex
// value, tooltip = the human-readable name).
function colorVariantsFormValue(input: FormRecord) {
	const raw = firstString(input, ["color_variants"]);

	if (!raw) {
		return [] as { color: string; src: string; tooltip: string }[];
	}

	let parsed: unknown;
	try {
		parsed = JSON.parse(raw);
	} catch {
		return [];
	}

	if (!Array.isArray(parsed)) {
		return [];
	}

	return parsed.flatMap((item) => {
		if (!item || typeof item !== "object") {
			return [];
		}

		const name = typeof (item as { name?: unknown }).name === "string"
			? (item as { name: string }).name.trim()
			: "";
		const imageUrl = typeof (item as { imageUrl?: unknown }).imageUrl === "string"
			? (item as { imageUrl: string }).imageUrl.trim()
			: "";
		const hex = typeof (item as { hex?: unknown }).hex === "string"
			? (item as { hex: string }).hex.trim()
			: "";

		if (!name || !imageUrl) {
			return [];
		}

		return [{ color: hex || "#9CA3AF", src: imageUrl, tooltip: name }];
	});
}

// Mirrors colorVariantsFormValue above - admin's FAQ field (faqs-field.tsx)
// posts one hidden input holding a JSON-encoded array of {question, answer}
// rows.
function faqsFormValue(input: FormRecord) {
	const raw = firstString(input, ["faqs"]);

	if (!raw) {
		return [] as { question: string; answer: string }[];
	}

	let parsed: unknown;
	try {
		parsed = JSON.parse(raw);
	} catch {
		return [];
	}

	if (!Array.isArray(parsed)) {
		return [];
	}

	return parsed.flatMap((item) => {
		if (!item || typeof item !== "object") {
			return [];
		}

		const question = typeof (item as { question?: unknown }).question === "string"
			? (item as { question: string }).question.trim()
			: "";
		const answer = typeof (item as { answer?: unknown }).answer === "string"
			? (item as { answer: string }).answer.trim()
			: "";

		return question && answer ? [{ question, answer }] : [];
	});
}

function slugify(value: string) {
	const slug = value
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");

	return slug || `item-${Date.now().toString(36)}`;
}

function initials(value: string) {
	return value
		.split(/\s+/)
		.map((part) => part[0])
		.join("")
		.slice(0, 2)
		.toUpperCase();
}

function normalizeStatus(value: string, allowed: string[], fallback: string) {
	const normalized = value.trim().toLowerCase();
	return allowed.includes(normalized) ? normalized : fallback;
}

const nameUniqueIndexes: Record<string, string> = {
	brand: "brands_name_unique_idx",
	category: "categories_name_unique_idx",
};

// Surface schema-level identity conflicts as expected validation errors
// instead of raw database failures.
function asDuplicateNameError(
	error: unknown,
	kind: "brand" | "category",
	name: string,
) {
	const pgError = error as { code?: string; constraint?: string };
	if (
		pgError?.code === "23505" &&
		pgError.constraint === nameUniqueIndexes[kind]
	) {
		return new HttpError(
			409,
			`A ${kind} named "${name}" already exists.`,
			"DUPLICATE_NAME",
		);
	}

	if (pgError?.code === "23505" && pgError.constraint === `${kind}s_slug_key`) {
		return new HttpError(
			409,
			`That ${kind} URL slug is already in use. Choose a different slug.`,
			"DUPLICATE_SLUG",
		);
	}

	return error instanceof Error ? error : new Error(String(error));
}

type Query = <T extends QueryResultRow>(text: string, params?: unknown[]) => Promise<QueryResult<T>>;

async function resolveCategoryId(input: FormRecord, query: Query = dbQuery) {
	const requestedId = firstString(input, ["category_id"]);

	if (requestedId) {
		const existing = await query<{ id: string }>(
			`SELECT id::text FROM categories WHERE id::text = $1 LIMIT 1`,
			[requestedId],
		);

		if (!existing.rows[0]) {
			throw new HttpError(
				400,
				"The selected category no longer exists. Refresh the form and choose another category.",
				"INVALID_CATEGORY",
			);
		}

		return existing.rows[0].id;
	}

	// Legacy clients may still submit a display name. Resolve it when it is
	// unambiguous, but never create catalog taxonomy from a product request.
	const legacyName = firstString(input, ["category"]);
	if (!legacyName) return null;

	const matches = await query<{ id: string }>(
		`
			SELECT id::text
			FROM categories
			WHERE lower(regexp_replace(btrim(name), '[[:space:]]+', ' ', 'g')) =
				lower(regexp_replace(btrim($1), '[[:space:]]+', ' ', 'g'))
			ORDER BY created_at ASC, id ASC
			LIMIT 2
		`,
		[legacyName],
	);

	if (matches.rows.length === 1) return matches.rows[0].id;

	if (matches.rows.length > 1) {
		throw new HttpError(
			409,
			"This category name is ambiguous. Resolve duplicate categories before saving the product.",
			"AMBIGUOUS_CATEGORY",
		);
	}

	throw new HttpError(
		400,
		"The selected category no longer exists. Refresh the form and choose another category.",
		"INVALID_CATEGORY",
	);
}

async function ensureBrand(rawName: string, query: Query = dbQuery) {
	const name = rawName.trim();
	if (!name) return null;

	// Brand selection still uses the legacy label contract. Resolve an
	// existing name first so a custom brand slug cannot cause a clone.
	const existing = await query<{ id: string }>(
		`SELECT id::text FROM brands WHERE lower(name) = lower($1) LIMIT 1`,
		[name],
	);
	if (existing.rows[0]) return existing.rows[0].id;

	const slug = slugify(name);
	const result = await query<{ id: string }>(
		`
			INSERT INTO brands (name, slug, initials, status)
			VALUES ($1, $2, $3, 'published')
			ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
			RETURNING id::text
		`,
		[name, slug, initials(name)],
	);

	return result.rows[0]?.id ?? null;
}

// SEO fields are only overwritten when the request carries them, so a
// client that doesn't know about the SEO tab can't silently wipe them.
function optionalSeoText(input: FormRecord, key: string, max: number) {
	if (!(key in input)) return null;
	return firstString(input, [key]).replace(/\s+/g, " ").slice(0, max);
}

type ProductSeoInput = {
	gtin: string | null;
	imageAlts: Record<string, string> | null;
	keywords: string[] | null;
	mpn: string | null;
	noindex: boolean | null;
	seoDescription: string | null;
	seoTitle: string | null;
};

function productSeoInput(input: FormRecord, galleryImageUrls: string[]): ProductSeoInput {
	let gtin: string | null = null;
	if ("gtin" in input) {
		gtin = normalizeGtin(firstString(input, ["gtin"]));
		if (gtin && !isValidGtin(gtin)) {
			throw new HttpError(
				400,
				"The GTIN isn't valid. Enter the 8, 12, 13 or 14 digits printed under the barcode (UPC, EAN or ISBN).",
				"INVALID_GTIN",
			);
		}
	}

	return {
		gtin,
		imageAlts: "image_alts" in input
			? parseImageAlts(firstString(input, ["image_alts"]), galleryImageUrls)
			: null,
		keywords: "meta_keywords" in input
			? parseKeywords(firstString(input, ["meta_keywords"]))
			: null,
		mpn: optionalSeoText(input, "mpn", 70),
		// A checkbox posts "on" when ticked and nothing when not; the form adds
		// a hidden "seo_noindex_present" marker so "unticked" is distinguishable
		// from "field not sent".
		noindex: "seo_noindex_present" in input
			? ["on", "true", "1"].includes(firstString(input, ["seo_noindex"]).toLowerCase())
			: null,
		seoDescription: optionalSeoText(input, "meta_desc", 320),
		seoTitle: optionalSeoText(input, "meta_title", 120),
	};
}

type ProductSlugRow = { id: string; slug: string };

/**
 * Pick the product's URL handle. An explicitly entered handle must be free;
 * without one, an existing product keeps its current URL (renaming a product
 * must not silently move its page) and a new product derives one from its
 * name, adding -2, -3… when that's taken.
 */
async function resolveProductSlug(
	client: PoolClient,
	input: FormRecord,
	name: string,
	existing: ProductSlugRow | undefined,
) {
	const requested = firstString(input, ["slug"]);

	if (requested) {
		const slug = slugifyHandle(requested);
		if (!slug) {
			throw new HttpError(
				400,
				"The URL handle needs at least one letter or number.",
				"INVALID_SLUG",
			);
		}
		const taken = await client.query<{ id: string }>(
			`SELECT id::text FROM products WHERE slug = $1 AND id::text <> $2 LIMIT 1`,
			[slug, existing?.id ?? ""],
		);
		if (taken.rows[0]) {
			throw new HttpError(
				409,
				`The URL handle "${slug}" is already used by another product. Choose a different one.`,
				"DUPLICATE_SLUG",
			);
		}
		return slug;
	}

	if (existing) return existing.slug;

	const base = slugifyHandle(name) || `product-${Date.now().toString(36)}`;
	const siblings = await client.query<{ slug: string }>(
		`SELECT slug FROM products WHERE slug = $1 OR slug LIKE $2`,
		[base, `${base.replace(/[\\%_]/g, "\\$&")}-%`],
	);
	const used = new Set(siblings.rows.map((row) => row.slug));
	if (!used.has(base)) return base;
	for (let suffix = 2; ; suffix += 1) {
		const candidate = `${base.slice(0, SEO_SLUG_MAX - String(suffix).length - 1)}-${suffix}`;
		if (!used.has(candidate)) return candidate;
	}
}

type ExistingProductRow = ProductSlugRow & { stock: number; version: string };

const PRODUCT_NAME_MAX = 200;
const SKU_MAX = 64;
const MAX_GALLERY_IMAGES = 20;
const MAX_VARIATIONS = 50;
const MAX_REVIEW_VIDEOS = 20;
// numeric(12, 2) in the products table.
const MAX_PRICE = 9_999_999_999.99;
const MAX_INT = 2_147_483_647;
const DISCOUNT_TYPES: DiscountType[] = ["fixed", "none", "percentage"];
const TAX_CLASSES = ["reduced", "standard", "zero"];

// Product writes are validated here rather than left to table constraints,
// so the admin sees which field to fix instead of a generic 500.
function invalidField(field: string, message: string): never {
	throw new HttpError(400, message, "INVALID_FIELD", { field });
}

/** Optional numeric field: blank means null; anything else must be in range. */
function numberField(
	input: FormRecord,
	key: string,
	label: string,
	{ integer = false, max, min = 0 }: { integer?: boolean; max?: number; min?: number } = {},
) {
	const raw = firstString(input, [key]);
	if (!raw) return null;

	const value = Number(raw);
	if (integer && Number.isInteger(value) && value > MAX_INT) {
		invalidField(key, `${label} is too large.`);
	}
	if (
		!Number.isFinite(value) ||
		value < min ||
		(max !== undefined && value > max) ||
		(integer && !Number.isInteger(value))
	) {
		const kind = integer ? "a whole number" : "a number";
		invalidField(
			key,
			max === undefined
				? `${label} must be ${kind} of ${min} or more.`
				: `${label} must be ${kind} between ${min} and ${max}.`,
		);
	}

	return value;
}

// Only same-site paths (uploads, bundled assets) or absolute http(s) URLs
// may be stored as product imagery - never javascript:, data: and the like.
function isSafeImageUrl(url: string) {
	if (url.startsWith("/")) return !url.startsWith("//");
	try {
		const parsed = new URL(url);
		return parsed.protocol === "https:" || parsed.protocol === "http:";
	} catch {
		return false;
	}
}

function variationsFormValue(input: FormRecord) {
	const raw = firstString(input, ["variations"]);
	if (!raw) return [] as { attribute: string; value: string }[];

	let parsed: unknown;
	try {
		parsed = JSON.parse(raw);
	} catch {
		invalidField("variations", "Variations could not be read. Refresh the page and try again.");
	}

	if (!Array.isArray(parsed)) return [];

	const rows = parsed.flatMap((item) => {
		if (!item || typeof item !== "object") return [];
		const { attribute, value } = item as { attribute?: unknown; value?: unknown };
		const cleanAttribute = typeof attribute === "string" ? attribute.trim().slice(0, 40) : "";
		const cleanValue = typeof value === "string" ? value.trim().slice(0, 120) : "";
		return cleanAttribute && cleanValue ? [{ attribute: cleanAttribute, value: cleanValue }] : [];
	});

	if (rows.length > MAX_VARIATIONS) {
		invalidField("variations", `A product can have at most ${MAX_VARIATIONS} variations.`);
	}

	return rows;
}

function reviewVideoUrlsValue(input: FormRecord) {
	const urls = [
		...new Set(
			firstString(input, ["review_videos"])
				.split(/[\s,]+/)
				.map((url) => url.trim())
				.filter(Boolean),
		),
	];

	if (urls.length > MAX_REVIEW_VIDEOS) {
		invalidField("review_videos", `Add at most ${MAX_REVIEW_VIDEOS} review video URLs.`);
	}

	for (const url of urls) {
		let protocol = "";
		try {
			protocol = new URL(url).protocol;
		} catch {
			// handled below
		}
		if (protocol !== "https:" && protocol !== "http:") {
			invalidField("review_videos", `"${url.slice(0, 80)}" isn't a valid video link. Use full https:// URLs, one per line.`);
		}
	}

	return urls;
}

function productConflictError(error: unknown) {
	const pgError = error as { code?: string; constraint?: string };
	if (pgError?.code !== "23505") return error;

	if (pgError.constraint === "products_sku_key") {
		return new HttpError(409, "That SKU is already used by another product. Enter a different SKU.", "DUPLICATE_SKU", { field: "sku" });
	}
	if (pgError.constraint === "products_slug_key") {
		return new HttpError(409, "That URL handle is already used by another product. Choose a different one.", "DUPLICATE_SLUG", { field: "slug" });
	}
	return error;
}

async function mutateProduct(input: FormRecord, mode: MutationMode) {
	try {
		return await withTransaction((client) => saveProduct(client, input, mode));
	} catch (error) {
		throw productConflictError(error);
	}
}

async function saveProduct(client: PoolClient, input: FormRecord, mode: MutationMode) {
	const query: Query = (text, params) => client.query(text, params);

	const name = firstString(input, ["name", "product_name"]);
	if (!name) invalidField("name", "Enter a product name.");
	if (name.length > PRODUCT_NAME_MAX) {
		invalidField("name", `Product name must be ${PRODUCT_NAME_MAX} characters or fewer.`);
	}

	const requestedSku = firstString(input, ["sku"]);
	if (requestedSku.length > SKU_MAX) {
		invalidField("sku", `SKU must be ${SKU_MAX} characters or fewer.`);
	}

	// Lock the row being edited so concurrent saves are serialised and the
	// version check below can't race.
	const existing = requestedSku
		? (
				await client.query<ExistingProductRow>(
					`SELECT p.id::text, p.slug, p.stock, ${productVersionSql("p")} AS version FROM products p WHERE p.sku = $1 FOR UPDATE`,
					[requestedSku],
				)
			).rows[0]
		: undefined;

	if (mode === "create" && existing) {
		throw new HttpError(
			409,
			`SKU "${requestedSku}" is already used by another product. Enter a different SKU.`,
			"DUPLICATE_SKU",
			{ field: "sku" },
		);
	}

	if (mode === "update") {
		if (!existing) {
			throw new HttpError(404, "This product no longer exists. It may have been deleted.", "PRODUCT_NOT_FOUND");
		}

		const expectedVersion = firstString(input, ["expected_version"]);
		const force = firstString(input, ["force"]) === "true";
		if (expectedVersion && expectedVersion !== existing.version && !force) {
			throw new HttpError(
				409,
				"Someone else saved changes to this product while you were editing.",
				"PRODUCT_CHANGED",
			);
		}
	}

	const regularPrice = numberField(input, "regular_price", "Price", { max: MAX_PRICE });
	if (regularPrice === null) invalidField("regular_price", "Enter the product price.");
	const rawDiscountType = firstString(input, ["discount_type"], "none") as DiscountType;
	const discountType = DISCOUNT_TYPES.includes(rawDiscountType) ? rawDiscountType : "none";
	const pricing = computePricing(
		regularPrice,
		discountType,
		numberField(input, "discount_value", "Discount") ?? 0,
	);
	if (pricing.error !== null) invalidField("discount_value", pricing.error);

	const submittedStock = numberField(input, "stock", "Stock quantity", { integer: true });
	if (submittedStock === null) invalidField("stock", "Enter the stock quantity (0 if none).");
	// Orders keep decrementing stock while the edit page is open, so an edit
	// is applied as a change relative to the stock the form loaded - writing
	// the form's number as-is would undo every sale made in the meantime.
	const loadedStock = existing ? numberField(input, "stock_loaded", "Loaded stock", { integer: true }) : null;
	const stock = existing && loadedStock !== null
		? Math.min(MAX_INT, Math.max(0, existing.stock + submittedStock - loadedStock))
		: submittedStock;

	const status = normalizeStatus(
		firstString(input, ["status"], "draft"),
		["archived", "draft", "low stock", "published"],
		"draft",
	);
	const taxClass = normalizeStatus(firstString(input, ["tax_class"], "standard"), TAX_CLASSES, "standard");

	// The gallery is the source of truth for imagery - image_url and
	// hover_image_url mirror its first two entries for the storefront views
	// that read those columns directly.
	const gallery = arrayValue(input, ["gallery_image_urls"]);
	if (gallery.length > MAX_GALLERY_IMAGES) {
		invalidField("gallery_image_urls", `A product can have at most ${MAX_GALLERY_IMAGES} gallery images.`);
	}
	if (gallery.some((url) => !isSafeImageUrl(url))) {
		invalidField("gallery_image_urls", "One of the gallery images has an invalid URL. Remove it and upload it again.");
	}
	const imageUrl = gallery[0] || "/assets/images/product-img/fashion/product-new-01-a-1.webp";
	const galleryImageUrls = gallery.length ? gallery : [imageUrl];

	const shortSummaryImage = firstString(input, ["short_summary_image"]);
	if (shortSummaryImage && !isSafeImageUrl(shortSummaryImage)) {
		invalidField("short_summary_image", "The short summary image has an invalid URL. Upload it again.");
	}

	const colorVariants = colorVariantsFormValue(input);
	if (colorVariants.some((variant) => !isSafeImageUrl(variant.src))) {
		invalidField("color_variants", "A color variant points at an invalid image. Pick its image again.");
	}

	const seo = productSeoInput(input, galleryImageUrls);
	const slug = await resolveProductSlug(client, input, name, existing);
	const sku =
		requestedSku ||
		`SKU-${slug.toUpperCase().replace(/-/g, "").slice(0, 10)}-${Date.now().toString(36).toUpperCase()}`;
	const categoryId = await resolveCategoryId(input, query);
	const brandName = firstString(input, ["brand_name", "brand"]).slice(0, 80);
	const brandId = brandName ? await ensureBrand(brandName, query) : null;

	// [column, value, insert default when the value is null]. A non-undefined
	// default marks a column that is only overwritten when the request
	// carries it (SEO fields), so older clients can't silently wipe it.
	const columns: [string, unknown, string?][] = [
		["name", name],
		["slug", slug],
		["description", firstString(input, ["description"])],
		["category_id", categoryId],
		["brand_id", brandId],
		["price", pricing.price],
		["old_price", pricing.oldPrice],
		["stock", stock],
		["status", status],
		["image_url", imageUrl],
		["hover_image_url", gallery[1] ?? null],
		["gallery_image_urls", galleryImageUrls],
		["rating", numberField(input, "average_rating", "Average rating", { max: 5 }) ?? 0],
		["review_count", numberField(input, "review_count", "Review count", { integer: true }) ?? 0],
		["storefront_badge", firstString(input, ["product_badges"]) || null],
		["tags", arrayValue(input, ["tags"])],
		["filter_color", arrayValue(input, ["color_swatches"])],
		["filter_sizes", arrayValue(input, ["style_options"])],
		["services", semicolonArrayValue(input, ["shipping_message"])],
		["color_variants", JSON.stringify(colorVariants)],
		["specifications", firstString(input, ["specifications"])],
		["short_summary", firstString(input, ["short_summary"])],
		["short_summary_image", shortSummaryImage],
		["short_summary_image_width", numberField(input, "short_summary_image_width", "Image width", { integer: true })],
		["short_summary_image_height", numberField(input, "short_summary_image_height", "Image height", { integer: true })],
		["key_highlights", semicolonArrayValue(input, ["key_highlights"])],
		["faqs", JSON.stringify(faqsFormValue(input))],
		["tax_class", taxClass],
		["vat_rate", numberField(input, "vat", "VAT", { max: 100 })],
		["weight_kg", numberField(input, "weight", "Weight", { max: 9_999_999 })],
		["width_cm", numberField(input, "width", "Width", { max: 99_999_999 })],
		["height_cm", numberField(input, "height", "Height", { max: 99_999_999 })],
		["length_cm", numberField(input, "length", "Length", { max: 99_999_999 })],
		["variations", JSON.stringify(variationsFormValue(input))],
		["review_video_urls", reviewVideoUrlsValue(input)],
		["seo_title", seo.seoTitle, "''"],
		["seo_description", seo.seoDescription, "''"],
		["seo_keywords", seo.keywords, "ARRAY[]::text[]"],
		["seo_noindex", seo.noindex, "false"],
		["image_alts", seo.imageAlts === null ? null : JSON.stringify(seo.imageAlts), "'{}'::jsonb"],
		["gtin", seo.gtin, "''"],
		["mpn", seo.mpn, "''"],
	];
	const params = columns.map(([, value]) => value);

	const result = existing
		? await client.query<{ id: string; sku: string }>(
				`
					UPDATE products SET ${columns
						.map(([column, , keepDefault], index) =>
							keepDefault === undefined
								? `${column} = $${index + 1}`
								: `${column} = COALESCE($${index + 1}, ${column})`,
						)
						.join(", ")}
					WHERE id = $${columns.length + 1}
					RETURNING id::text, sku
				`,
				[...params, existing.id],
			)
		: await client.query<{ id: string; sku: string }>(
				`
					INSERT INTO products (sku, ${columns.map(([column]) => column).join(", ")})
					VALUES ($1, ${columns
						.map(([, , insertDefault], index) =>
							insertDefault === undefined
								? `$${index + 2}`
								: `COALESCE($${index + 2}, ${insertDefault})`,
						)
						.join(", ")})
					RETURNING id::text, sku
				`,
				[sku, ...params],
			);
	const saved = result.rows[0];

	// rating/review_count are a snapshot of approved reviews (see
	// lib/backend/product-ratings.ts). The form's manual values only apply
	// to products nobody has reviewed yet - otherwise a save would overwrite
	// live review totals with whatever the form loaded.
	await client.query(
		`
			UPDATE products p
			SET rating = s.average, review_count = s.total
			FROM (
				SELECT ROUND(AVG(rating)::numeric, 2) AS average, COUNT(*)::int AS total
				FROM product_reviews
				WHERE product_id = $1 AND status = 'approved'
			) s
			WHERE p.id = $1 AND s.total > 0
		`,
		[saved.id],
	);

	// Keep every retired handle pointing at this product, and release the
	// handle it now uses in case it was retired earlier (renamed back).
	if (existing && existing.slug !== slug) {
		await client.query(
			`
				INSERT INTO product_slug_redirects (old_slug, product_id)
				VALUES ($1, $2)
				ON CONFLICT (old_slug) DO UPDATE SET product_id = EXCLUDED.product_id, created_at = now()
			`,
			[existing.slug, saved.id],
		);
	}
	await client.query(`DELETE FROM product_slug_redirects WHERE old_slug = $1`, [slug]);

	const version = await client.query<{ version: string }>(
		`SELECT ${productVersionSql("p")} AS version FROM products p WHERE p.id = $1`,
		[saved.id],
	);

	return { ...saved, version: version.rows[0].version };
}

async function mutateCategory(input: FormRecord, mode: MutationMode) {
	const name = firstString(input, ["name"], "Untitled Category");
	const slug = slugify(firstString(input, ["slug"], name));
	const status = normalizeStatus(
		firstString(input, ["status"], "draft"),
		["draft", "published"],
		"draft",
	);
	const sortOrder = Math.max(
		0,
		Math.min(1_000_000, Math.trunc(numberValue(input, ["sort_order"], 100))),
	);
	const description = firstString(input, ["description", "meta_description"]);
	const imageUrl = firstString(
		input,
		["image_url"],
		"/assets/images/catagory-img/cat-bg-headphones-01.webp",
	);
	const meta = {
		keywords: firstString(input, ["meta_keywords"]),
		template: firstString(input, ["template"]),
		title: firstString(input, ["meta_title"]),
	};

	try {
		if (mode === "update") {
			const categoryId = firstString(input, ["category_id"]);
			const originalSlug = firstString(input, ["original_slug"]);

			if (!categoryId && !originalSlug) {
				throw new HttpError(
					400,
					"A category ID is required to update this category.",
					"CATEGORY_ID_REQUIRED",
				);
			}

			const targetColumn = categoryId ? "id::text" : "slug";
			const targetValue = categoryId || originalSlug;
			const result = await dbQuery<{ id: string; slug: string }>(
				`
					UPDATE categories
					SET name = $1, slug = $2, description = $3, status = $4,
						image_url = $5, meta = $6, sort_order = $7, updated_at = now()
					WHERE ${targetColumn} = $8
					RETURNING id::text, slug
				`,
				[name, slug, description, status, imageUrl, meta, sortOrder, targetValue],
			);

			if (!result.rows[0]) {
				throw new HttpError(404, "Category not found.", "CATEGORY_NOT_FOUND");
			}

			return result.rows[0];
		}

		const result = await dbQuery<{ id: string; slug: string }>(
			`
				INSERT INTO categories (
					name, slug, description, status, image_url, meta, sort_order
				)
				VALUES ($1, $2, $3, $4, $5, $6, $7)
				RETURNING id::text, slug
			`,
			[name, slug, description, status, imageUrl, meta, sortOrder],
		);

		return result.rows[0];
	} catch (error) {
		throw asDuplicateNameError(error, "category", name);
	}
}

async function mutateBrand(input: FormRecord) {
	const name = firstString(input, ["name"], "Untitled Brand");
	const slug = slugify(firstString(input, ["slug"], name));
	const status = normalizeStatus(
		firstString(input, ["status"], "draft"),
		["archived", "draft", "published"],
		"draft",
	);
	const visibility = firstString(input, ["visibility"], "Standard");

	try {
		const result = await dbQuery<{ id: string; slug: string }>(
			`
				INSERT INTO brands (
					name, slug, website, initials, visibility, status, description, meta
				)
				VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
				ON CONFLICT (slug)
				DO UPDATE SET name = EXCLUDED.name, website = EXCLUDED.website,
					initials = EXCLUDED.initials, visibility = EXCLUDED.visibility,
					status = EXCLUDED.status, description = EXCLUDED.description, meta = EXCLUDED.meta
				RETURNING id::text, slug
			`,
			[
				name,
				slug,
				firstString(input, ["website"]),
				initials(name),
				["Featured", "Hidden", "Standard"].includes(visibility)
					? visibility
					: "Standard",
				status,
				firstString(input, ["description"]),
				{
					country: firstString(input, ["country"]),
					description: firstString(input, ["meta_description"]),
					keywords: firstString(input, ["meta_keywords"]),
					supportEmail: firstString(input, ["support_email"]),
					title: firstString(input, ["meta_title"]),
					vendorCode: firstString(input, ["vendor_code"]),
				},
			],
		);

		return result.rows[0];
	} catch (error) {
		throw asDuplicateNameError(error, "brand", name);
	}
}

async function mutateCoupon(input: FormRecord) {
	const name = firstString(input, ["name"], "Untitled Coupon");
	const code = firstString(input, ["code"], slugify(name).replace(/-/g, "").toUpperCase()).toUpperCase();
	const type = normalizeStatus(
		firstString(input, ["discount_type", "type"], "percentage"),
		["fixed", "percentage", "shipping"],
		"percentage",
	);
	const status = normalizeStatus(
		firstString(input, ["status"], "draft"),
		["active", "draft", "expired", "scheduled"],
		"draft",
	);

	const result = await dbQuery<{ code: string; id: string }>(
		`
			INSERT INTO coupons (
				code, name, summary, type, discount_value, minimum_order,
				maximum_discount, usage_limit, status, starts_at, ends_at
			)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NULLIF($10, '')::date, NULLIF($11, '')::date)
			ON CONFLICT (code)
			DO UPDATE SET name = EXCLUDED.name, summary = EXCLUDED.summary,
				type = EXCLUDED.type, discount_value = EXCLUDED.discount_value,
				minimum_order = EXCLUDED.minimum_order, maximum_discount = EXCLUDED.maximum_discount,
				usage_limit = EXCLUDED.usage_limit, status = EXCLUDED.status,
				starts_at = EXCLUDED.starts_at, ends_at = EXCLUDED.ends_at
			RETURNING id::text, code
		`,
		[
			code,
			name,
			firstString(input, ["description", "summary"]),
			type,
			numberValue(input, ["discount_value"], 0),
			numberValue(input, ["minimum_order"], 0),
			numberValue(input, ["maximum_discount"], 0) || null,
			numberValue(input, ["usage_limit"], 0) || null,
			status,
			firstString(input, ["start_date"]),
			firstString(input, ["end_date"]),
		],
	);

	return result.rows[0];
}

async function mutateCustomer(input: FormRecord) {
	const name = firstString(input, ["name"], "Unnamed Customer");
	const email = firstString(input, ["email"]).toLowerCase();

	if (!email) {
		throw new HttpError(400, "Email is required.", "VALIDATION_ERROR");
	}

	const rawStatus = firstString(input, ["status"], "active").toLowerCase();
	const status = rawStatus === "active" ? "active" : "review";
	const result = await dbQuery<{ email: string; id: string }>(
		`
			INSERT INTO customers (name, email, segment, status, avatar_class)
			VALUES ($1, $2, $3, $4, $5)
			ON CONFLICT (email)
			DO UPDATE SET name = EXCLUDED.name, segment = EXCLUDED.segment,
				status = EXCLUDED.status, avatar_class = EXCLUDED.avatar_class
			RETURNING id::text, email
		`,
		[
			name,
			email,
			firstString(input, ["role", "segment"], "Retail"),
			status,
			"bg-brand-50 text-brand-600",
		],
	);

	return result.rows[0];
}

async function mutateUser(input: FormRecord, mode: MutationMode) {
	const name = firstString(input, ["name"], "New User");
	const email = firstString(input, ["email"]).toLowerCase();

	if (!email) {
		throw new HttpError(400, "Email is required.", "VALIDATION_ERROR");
	}

	const role = normalizeStatus(
		firstString(input, ["role"], "support"),
		["admin", "manager", "support", "customer"],
		"support",
	) as AdminUser["role"];
	const status = normalizeStatus(
		firstString(input, ["status"], "active"),
		["active", "disabled", "review"],
		"active",
	) as AdminUser["status"];
	const password = firstString(input, ["password"]);

	if (mode === "create") {
		if (password.length < 8) {
			throw new HttpError(
				400,
				"Password must be at least 8 characters.",
				"VALIDATION_ERROR",
			);
		}

		const passwordHash = await bcrypt.hash(password, BCRYPT_COST);
		const result = await dbQuery<{ email: string; id: string }>(
			`
				INSERT INTO app_users (name, email, password_hash, role, status)
				VALUES ($1, $2, $3, $4, $5)
				ON CONFLICT (email) DO NOTHING
				RETURNING id::text, email
			`,
			[name, email, passwordHash, role, status],
		);

		const created = result.rows[0];

		if (!created) {
			throw new HttpError(
				409,
				"A user with this email already exists.",
				"EMAIL_TAKEN",
			);
		}

		return created;
	}

	if (password && password.length < 8) {
		throw new HttpError(
			400,
			"Password must be at least 8 characters.",
			"VALIDATION_ERROR",
		);
	}

	const passwordHash = password ? await bcrypt.hash(password, BCRYPT_COST) : null;
	const result = await dbQuery<{ email: string; id: string }>(
		`
			UPDATE app_users
			SET name = $1, role = $2, status = $3, password_hash = COALESCE($4, password_hash)
			WHERE email = $5
			RETURNING id::text, email
		`,
		[name, role, status, passwordHash, email],
	);

	const updated = result.rows[0];

	if (!updated) {
		throw new HttpError(404, "User not found.", "RESOURCE_NOT_FOUND");
	}

	return updated;
}

async function mutateAttribute(input: FormRecord) {
	const name = firstString(input, ["name"], "Untitled Attribute");
	const type = firstString(input, ["display_type", "type"], "Dropdown");
	const status = normalizeStatus(
		firstString(input, ["status"], "active"),
		["active", "draft"],
		"active",
	);

	const result = await dbQuery<{ id: string; name: string }>(
		`
			INSERT INTO product_attributes (name, type, values, status)
			VALUES ($1, $2, $3, $4)
			ON CONFLICT (name)
			DO UPDATE SET type = EXCLUDED.type, values = EXCLUDED.values, status = EXCLUDED.status
			RETURNING id::text, name
		`,
		[
			name,
			["Dropdown", "Swatch", "Text"].includes(type) ? type : "Dropdown",
			arrayValue(input, ["values", "value"]),
			status,
		],
	);

	return result.rows[0];
}

async function mutateShippingMethod(input: FormRecord) {
	const name = firstString(input, ["name"], "Untitled Method");
	const status = normalizeStatus(
		firstString(input, ["status"], "active"),
		["active", "inactive"],
		"active",
	);
	const minDays = numberValue(input, ["min_delivery_days"], 0) || null;
	const maxDays = numberValue(input, ["max_delivery_days"], 0) || null;

	const result = await dbQuery<{ id: string; name: string }>(
		`
			INSERT INTO shipping_methods (
				name, description, carrier, price, min_delivery_days,
				max_delivery_days, status, sort_order
			)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
			ON CONFLICT (name)
			DO UPDATE SET description = EXCLUDED.description, carrier = EXCLUDED.carrier,
				price = EXCLUDED.price, min_delivery_days = EXCLUDED.min_delivery_days,
				max_delivery_days = EXCLUDED.max_delivery_days, status = EXCLUDED.status,
				sort_order = EXCLUDED.sort_order
			RETURNING id::text, name
		`,
		[
			name,
			firstString(input, ["description"]),
			firstString(input, ["carrier"]),
			numberValue(input, ["price"], 0),
			minDays,
			maxDays,
			status,
			numberValue(input, ["sort_order"], 0),
		],
	);

	return result.rows[0];
}

async function mutateAdvertisement(input: FormRecord) {
	const title = firstString(input, ["title"], "Untitled Advertisement");
	const imageUrl = firstString(input, ["image_url"]);

	if (!imageUrl) {
		throw new HttpError(400, "An image is required.", "VALIDATION_ERROR");
	}

	const status = normalizeStatus(
		firstString(input, ["status"], "active"),
		["active", "inactive"],
		"active",
	);

	const result = await dbQuery<{ id: string; title: string }>(
		`
			INSERT INTO advertisements (title, image_url, link_url, status, sort_order)
			VALUES ($1, $2, $3, $4, $5)
			ON CONFLICT (title)
			DO UPDATE SET image_url = EXCLUDED.image_url, link_url = EXCLUDED.link_url,
				status = EXCLUDED.status, sort_order = EXCLUDED.sort_order
			RETURNING id::text, title
		`,
		[
			title,
			imageUrl,
			firstString(input, ["link_url"]),
			status,
			numberValue(input, ["sort_order"], 0),
		],
	);

	return result.rows[0];
}

function addressValue(input: FormRecord, prefix: string) {
	const address1 = firstString(input, [`${prefix}_address1`]);

	if (!address1) {
		return null;
	}

	return {
		address1,
		address2: firstString(input, [`${prefix}_address2`]),
		city: firstString(input, [`${prefix}_city`]),
		country: firstString(input, [`${prefix}_country`]),
		postcode: firstString(input, [`${prefix}_postcode`]),
		state: firstString(input, [`${prefix}_state`]),
	};
}

async function mutateOrder(input: FormRecord) {
	const selectedSkus = arrayValue(input, ["product_skus"]);
	// A blank order_number means this is a genuinely new order (the edit form
	// always submits the real order_number as a hidden field - see
	// admin/components/orders/order-form.tsx).
	const orderNumber =
		firstString(input, ["order_number"]) ||
		Date.now().toString().slice(-8);
	const customerName = firstString(input, ["customer_name"], "Admin Order");
	const customerEmail = firstString(input, ["customer_email"]);
	const paymentMethod = firstString(input, ["payment_method"]);
	const billingAddress = addressValue(input, "billing");
	const shippingAddress = addressValue(input, "shipping") ?? billingAddress;
	const status = normalizeStatus(
		firstString(input, ["status"], "delivering"),
		["cancelled", "completed", "delivering", "failed", "pending"],
		"delivering",
	);
	const paymentStatus = normalizeStatus(
		firstString(input, ["payment_status"], "unpaid"),
		["paid", "refunded", "unpaid"],
		"unpaid",
	);

	return withTransaction(async (client) => {
		const totals =
			selectedSkus.length > 0
				? await client.query<{ total: string }>(
						"SELECT COALESCE(SUM(price), 0) AS total FROM products WHERE sku = ANY($1::text[])",
						[selectedSkus],
					)
				: { rows: [{ total: "0" }] };
		const total = Number(totals.rows[0]?.total ?? 0);
		const order = await client.query<{ id: string; order_number: string }>(
			`
				INSERT INTO orders (
					order_number, customer_name, customer_email, status, total,
					payment_status, payment_method, billing_address, shipping_address
				)
				VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
				ON CONFLICT (order_number)
				DO UPDATE SET customer_name = EXCLUDED.customer_name,
					customer_email = EXCLUDED.customer_email,
					status = EXCLUDED.status, total = EXCLUDED.total,
					payment_status = EXCLUDED.payment_status,
					payment_method = EXCLUDED.payment_method,
					billing_address = EXCLUDED.billing_address,
					shipping_address = EXCLUDED.shipping_address
				RETURNING id::text, order_number
			`,
			[
				orderNumber,
				customerName,
				customerEmail,
				status,
				total,
				paymentStatus,
				paymentMethod,
				// billing_address/shipping_address are NOT NULL columns - an
				// admin editing status/payment on an order with no address on
				// file (e.g. imported/legacy orders) still needs to be able
				// to save, so an unset address becomes {} rather than null.
				billingAddress ?? {},
				shippingAddress ?? {},
			],
		);
		const orderId = order.rows[0]?.id;

		if (orderId && selectedSkus.length) {
			await client.query("DELETE FROM order_items WHERE order_id = $1", [orderId]);
			await client.query(
				`
					INSERT INTO order_items (order_id, product_id, product_name, sku, image_url, qty, unit_price)
					SELECT $1, id, name, sku, image_url, 1, price
					FROM products
					WHERE sku = ANY($2::text[])
				`,
				[orderId, selectedSkus],
			);
		}

		return order.rows[0];
	});
}

async function mutateReview(input: FormRecord, mode: MutationMode) {
	const status = normalizeStatus(
		firstString(input, ["status"], "pending"),
		["approved", "draft", "pending"],
		"pending",
	);

	// The per-product admin panel only ever changes status on an existing
	// review (approve/reject) - never rating/review text, so a quick
	// status-only PATCH doesn't need to re-submit the whole review body.
	const id = firstString(input, ["id"]);
	if (mode === "update" && id) {
		const result = await dbQuery<{ id: string; product_id: string | null }>(
			`
				UPDATE product_reviews
				SET status = $1
				WHERE id = $2
				RETURNING id::text, product_id::text
			`,
			[status, id],
		);

		const updated = result.rows[0];

		if (!updated) {
			throw new HttpError(404, "Review not found.", "RESOURCE_NOT_FOUND");
		}

		if (updated.product_id) {
			await syncProductRatingSummary(updated.product_id);
		}

		return updated;
	}

	const productName = firstString(input, ["product", "product_name"], "Product");
	const customerName = firstString(input, ["customer", "customer_name"], "Customer");

	const result = await dbQuery<{ id: string }>(
		`
			INSERT INTO product_reviews (product_name, customer_name, rating, review, status)
			VALUES ($1, $2, $3, $4, $5)
			RETURNING id::text
		`,
		[
			productName,
			customerName,
			Math.max(1, Math.min(5, Math.round(numberValue(input, ["rating"], 5)))),
			firstString(input, ["review"], ""),
			status,
		],
	);

	return result.rows[0];
}

async function mutateSupportTicket(input: FormRecord) {
	const ticketNumber =
		firstString(input, ["ticket_number"]) ||
		`TK-${Date.now().toString().slice(-6)}`;
	const title = firstString(input, ["title"], `#${ticketNumber}`);
	const priority = firstString(input, ["priority"], "Medium");
	const status = normalizeStatus(
		firstString(input, ["status"], "open"),
		["open", "pending", "resolved"],
		"open",
	);

	const result = await dbQuery<{ id: string; ticket_number: string }>(
		`
			INSERT INTO support_tickets (ticket_number, title, customer_name, priority, status, assignee, email, phone, message)
			VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
			ON CONFLICT (ticket_number)
			DO UPDATE SET title = EXCLUDED.title, customer_name = EXCLUDED.customer_name,
				priority = EXCLUDED.priority, status = EXCLUDED.status, assignee = EXCLUDED.assignee,
				email = EXCLUDED.email, phone = EXCLUDED.phone, message = EXCLUDED.message
			RETURNING id::text, ticket_number
		`,
		[
			ticketNumber,
			title,
			firstString(input, ["customer", "customer_name"], "Customer"),
			["High", "Low", "Medium"].includes(priority) ? priority : "Medium",
			status,
			firstString(input, ["assignee"], "Support Team"),
			firstString(input, ["email"], "") || null,
			firstString(input, ["phone"], "") || null,
			firstString(input, ["message"], ""),
		],
	);

	return result.rows[0];
}

async function mutateStoreSettings(input: FormRecord) {
	const result = await dbQuery<{ id: number }>(
		`
			UPDATE store_settings
			SET store_name = $1, support_email = $2, support_phone = $3, address = $4, chat_link = $5
			WHERE id = 1
			RETURNING id
		`,
		[
			firstString(input, ["store_name"], ""),
			firstString(input, ["support_email"], ""),
			firstString(input, ["support_phone"], ""),
			firstString(input, ["address"], ""),
			firstString(input, ["chat_link"], ""),
		],
	);

	return result.rows[0];
}

export async function mutateAdminResource(
	resource: string,
	body: unknown,
	mode: MutationMode,
) {
	assertMutationResource(resource);
	const input = genericPayloadSchema.parse(body);

	switch (resource) {
		case "advertisements":
			return mutateAdvertisement(input);
		case "attributes":
			return mutateAttribute(input);
		case "brands":
			return mutateBrand(input);
		case "categories":
			return mutateCategory(input, mode);
		case "coupons":
			return mutateCoupon(input);
		case "customers":
			return mutateCustomer(input);
		case "orders":
			return mutateOrder(input);
		case "products":
			return mutateProduct(input, mode);
		case "reviews":
			return mutateReview(input, mode);
		case "shipping-methods":
			return mutateShippingMethod(input);
		case "store-settings":
			return mutateStoreSettings(input);
		case "support-tickets":
			return mutateSupportTicket(input);
		case "users":
			return mutateUser(input, mode);
		default:
			throw new HttpError(404, "Unknown admin resource.", "RESOURCE_NOT_FOUND");
	}
}
