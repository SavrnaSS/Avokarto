import { randomUUID } from "node:crypto";
import { z } from "zod";
import { dbQuery, withTransaction } from "@/lib/backend/db";
import { HttpError } from "@/lib/backend/http";
import { storeUploadedImage } from "@/lib/backend/image-upload";
import { listStoreListings, requireStoreForCustomer } from "@/lib/backend/resellers";
import { saveUpload } from "@/lib/backend/upload-storage";

/*
 * Promo reels: short vertical videos Avokarto makes for a catalog product.
 * Admins upload them per product (admin product editor → Promo reels);
 * resellers get the reels of every product in their store on Studio's
 * Reels page, to download and post on Instagram Reels, TikTok and YouTube
 * Shorts with their own store link.
 */

export const MAX_REELS_PER_PRODUCT = 8;
export const MAX_REEL_BYTES = 100 * 1024 * 1024;

export type ProductReel = {
	createdAt: string;
	durationSeconds: number | null;
	id: string;
	posterUrl: string;
	sizeBytes: number;
	title: string;
	videoUrl: string;
};

type ReelRow = {
	created_at: Date;
	duration_seconds: string | null;
	id: string;
	poster_url: string;
	product_id: string;
	size_bytes: string;
	title: string;
	video_url: string;
};

const REEL_SELECT = `SELECT id::text, product_id::text, video_url, poster_url, title, duration_seconds, size_bytes, created_at FROM product_reels`;

function toReel(row: ReelRow): ProductReel {
	return {
		createdAt: row.created_at.toISOString(),
		durationSeconds: row.duration_seconds === null ? null : Number(row.duration_seconds),
		id: row.id,
		posterUrl: row.poster_url,
		sizeBytes: Number(row.size_bytes),
		title: row.title,
		videoUrl: row.video_url,
	};
}

// The browser-reported type is client-controlled: an MP4 (ISO base media
// file) carries the "ftyp" box right after its first 4 size bytes.
function isMp4(bytes: Buffer) {
	return bytes.length > 12 && bytes.subarray(4, 8).toString("ascii") === "ftyp";
}

async function storeUploadedVideo(file: unknown) {
	if (!(file instanceof File)) {
		throw new HttpError(400, "Choose an MP4 video to upload.", "MISSING_FILE");
	}
	if (file.type && file.type !== "video/mp4") {
		throw new HttpError(415, "Reels must be MP4 videos (H.264, the format Instagram, TikTok and YouTube all accept).", "UNSUPPORTED_TYPE");
	}
	if (file.size > MAX_REEL_BYTES) {
		throw new HttpError(413, `Reels must be ${MAX_REEL_BYTES / 1024 / 1024}MB or smaller.`, "FILE_TOO_LARGE");
	}
	const bytes = Buffer.from(await file.arrayBuffer());
	if (!isMp4(bytes)) {
		throw new HttpError(415, "That file isn't a valid MP4 video.", "UNSUPPORTED_TYPE");
	}
	const filename = `${randomUUID()}.mp4`;
	await saveUpload(filename, bytes, "video/mp4");
	return { sizeBytes: bytes.byteLength, url: `/api/uploads/${filename}` };
}

async function assertProduct(productId: string) {
	if (!z.string().uuid().safeParse(productId).success) {
		throw new HttpError(404, "Product not found.", "NOT_FOUND");
	}
	const result = await dbQuery(`SELECT 1 FROM products WHERE id = $1`, [productId]);
	if (!result.rowCount) throw new HttpError(404, "Product not found.", "NOT_FOUND");
}

/** Admin: a product's reels, in display order. */
export async function listProductReels(productId: string) {
	await assertProduct(productId);
	const result = await dbQuery<ReelRow>(`${REEL_SELECT} WHERE product_id = $1 ORDER BY position, created_at`, [productId]);
	return result.rows.map(toReel);
}

const addReelSchema = z.object({
	durationSeconds: z.coerce.number().min(0).max(600).optional(),
	title: z.string().trim().max(120).default(""),
});

/**
 * Admin: upload a reel (multipart: `file` MP4, optional `poster` image,
 * `title`, `durationSeconds` - read from the video in the admin's browser).
 */
export async function addProductReel(productId: string, form: FormData) {
	await assertProduct(productId);
	const count = await dbQuery<{ total: number }>(`SELECT count(*)::int AS total FROM product_reels WHERE product_id = $1`, [productId]);
	if ((count.rows[0]?.total ?? 0) >= MAX_REELS_PER_PRODUCT) {
		throw new HttpError(409, `A product can have up to ${MAX_REELS_PER_PRODUCT} reels - remove one first.`, "TOO_MANY_REELS");
	}
	const parsed = addReelSchema.safeParse({
		durationSeconds: form.get("durationSeconds") || undefined,
		title: form.get("title") ?? "",
	});
	if (!parsed.success) throw new HttpError(400, "Check the reel's title.", "INVALID_FIELD", { field: "title" });

	const video = await storeUploadedVideo(form.get("file"));
	const poster = form.get("poster");
	const posterUrl = poster instanceof File && poster.size > 0 ? await storeUploadedImage(poster) : "";

	const result = await dbQuery<ReelRow>(
		`INSERT INTO product_reels (product_id, video_url, poster_url, title, duration_seconds, size_bytes, position)
		VALUES ($1, $2, $3, $4, $5, $6, (SELECT coalesce(max(position) + 1, 0) FROM product_reels WHERE product_id = $1))
		RETURNING id::text, product_id::text, video_url, poster_url, title, duration_seconds, size_bytes, created_at`,
		[productId, video.url, posterUrl, parsed.data.title, parsed.data.durationSeconds ?? null, video.sizeBytes],
	);
	return toReel(result.rows[0]);
}

const updateReelSchema = z.object({
	move: z.enum(["up", "down"]).optional(),
	title: z.string().trim().max(120).optional(),
});

/** Admin: rename a reel, or move it one place up/down in the product's list. */
export async function updateProductReel(productId: string, reelId: string, body: unknown) {
	const parsed = updateReelSchema.safeParse(body);
	if (!parsed.success) throw new HttpError(400, "Check the reel's title.", "INVALID_FIELD", { field: "title" });
	const input = parsed.data;
	await withTransaction(async (client) => {
		const reels = await client.query<{ id: string }>(
			`SELECT id::text FROM product_reels WHERE product_id = $1 ORDER BY position, created_at FOR UPDATE`,
			[productId],
		);
		const ids = reels.rows.map((row) => row.id);
		const index = ids.indexOf(reelId);
		if (index === -1) throw new HttpError(404, "Reel not found.", "NOT_FOUND");
		if (input.title !== undefined) {
			await client.query(`UPDATE product_reels SET title = $2 WHERE id = $1`, [reelId, input.title]);
		}
		if (input.move) {
			const target = input.move === "up" ? index - 1 : index + 1;
			if (target >= 0 && target < ids.length) {
				[ids[index], ids[target]] = [ids[target], ids[index]];
				// Rewrite positions as 0..n so the order stays dense and stable.
				await client.query(
					`UPDATE product_reels r SET position = o.position - 1
					FROM unnest($1::uuid[]) WITH ORDINALITY AS o(id, position) WHERE r.id = o.id`,
					[ids],
				);
			}
		}
	});
	return listProductReels(productId);
}

/** Admin: remove a reel. (The file stays in storage - uploads are never rewritten.) */
export async function deleteProductReel(productId: string, reelId: string) {
	const result = await dbQuery(`DELETE FROM product_reels WHERE id::text = $1 AND product_id::text = $2`, [reelId, productId]);
	if (!result.rowCount) throw new HttpError(404, "Reel not found.", "NOT_FOUND");
}

export type SellerReel = ProductReel & {
	product: {
		category: string;
		id: string;
		imageUrl: string;
		isActive: boolean;
		name: string;
		price: number;
		slug: string;
	};
};

/**
 * Seller: the reels of every product in their store (active listings
 * first), with what's needed to write the post: name, store price, slug.
 */
export async function listSellerReels(customerId: string) {
	const store = await requireStoreForCustomer(customerId);
	const listings = await listStoreListings(store.id);
	if (!listings.length) return [];
	const byProduct = new Map(listings.map((listing) => [listing.productId, listing]));
	const result = await dbQuery<ReelRow>(
		`${REEL_SELECT} WHERE product_id = ANY($1::uuid[]) ORDER BY position, created_at DESC`,
		[[...byProduct.keys()]],
	);
	const order = new Map(listings.map((listing, index) => [listing.productId, index]));
	return result.rows
		.map((row): SellerReel => {
			const listing = byProduct.get(row.product_id)!;
			return {
				...toReel(row),
				product: {
					category: listing.category,
					id: listing.productId,
					imageUrl: listing.imageUrl,
					isActive: listing.isActive,
					name: listing.productName,
					price: listing.salePrice,
					slug: listing.productSlug,
				},
			};
		})
		// Products the shopper can actually buy first, then the store's own order.
		.sort((a, b) => Number(b.product.isActive) - Number(a.product.isActive) || (order.get(a.product.id)! - order.get(b.product.id)!));
}
