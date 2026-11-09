import { randomUUID } from "node:crypto";
import { z } from "zod";
import { dbQuery } from "@/lib/backend/db";
import { HttpError } from "@/lib/backend/http";
import { storeUploadedImage } from "@/lib/backend/image-upload";
import { requireStoreForCustomer } from "@/lib/backend/resellers";
import { saveUpload } from "@/lib/backend/upload-storage";

/*
 * A seller's own promo videos. Studio → Videos renders them in the
 * seller's browser (canvas + MediaRecorder) from their store's products;
 * saving uploads the finished file here so it can be downloaded or shared
 * later from any device. Rendering never happens on the server.
 */

export const MAX_SELLER_VIDEOS = 60;
export const MAX_SELLER_VIDEO_BYTES = 60 * 1024 * 1024;
export const VIDEO_TEMPLATES = ["spotlight", "price-drop", "collection", "minimal"] as const;
export const VIDEO_ASPECTS = ["9:16", "1:1", "16:9"] as const;

export type SellerVideo = {
	aspect: (typeof VIDEO_ASPECTS)[number];
	createdAt: string;
	durationSeconds: number;
	format: "mp4" | "webm";
	id: string;
	posterUrl: string;
	productId: string | null;
	sizeBytes: number;
	template: (typeof VIDEO_TEMPLATES)[number];
	title: string;
	videoUrl: string;
};

type VideoRow = {
	aspect: SellerVideo["aspect"];
	created_at: Date;
	duration_seconds: string;
	id: string;
	poster_url: string;
	product_id: string | null;
	size_bytes: string;
	template: SellerVideo["template"];
	title: string;
	video_url: string;
};

const VIDEO_COLUMNS = `id::text, product_id::text, video_url, poster_url, title, template, aspect, duration_seconds, size_bytes, created_at`;

function toVideo(row: VideoRow): SellerVideo {
	return {
		aspect: row.aspect,
		createdAt: row.created_at.toISOString(),
		durationSeconds: Number(row.duration_seconds),
		format: row.video_url.endsWith(".webm") ? "webm" : "mp4",
		id: row.id,
		posterUrl: row.poster_url,
		productId: row.product_id,
		sizeBytes: Number(row.size_bytes),
		template: row.template,
		title: row.title,
		videoUrl: row.video_url,
	};
}

// The browser-reported type is client-controlled: check the file's own
// signature. MP4 carries "ftyp" after its first 4 size bytes; WebM is an
// EBML document (1A 45 DF A3) declaring the "webm" doctype early on.
function videoFormat(bytes: Buffer): "mp4" | "webm" | null {
	if (bytes.length > 12 && bytes.subarray(4, 8).toString("ascii") === "ftyp") return "mp4";
	if (bytes.length > 40 && bytes[0] === 0x1a && bytes[1] === 0x45 && bytes[2] === 0xdf && bytes[3] === 0xa3 && bytes.subarray(0, 64).includes("webm")) {
		return "webm";
	}
	return null;
}

async function storeVideoFile(file: unknown) {
	if (!(file instanceof File)) throw new HttpError(400, "The video didn't arrive - try saving again.", "MISSING_FILE");
	if (file.size > MAX_SELLER_VIDEO_BYTES) {
		throw new HttpError(413, `Videos must be ${MAX_SELLER_VIDEO_BYTES / 1024 / 1024}MB or smaller - try a shorter length.`, "FILE_TOO_LARGE");
	}
	const bytes = Buffer.from(await file.arrayBuffer());
	const format = videoFormat(bytes);
	if (!format) throw new HttpError(415, "That file isn't an MP4 or WebM video.", "UNSUPPORTED_TYPE");
	const filename = `${randomUUID()}.${format}`;
	await saveUpload(filename, bytes, format === "mp4" ? "video/mp4" : "video/webm");
	return { sizeBytes: bytes.byteLength, url: `/api/uploads/${filename}` };
}

/** The signed-in seller's saved videos, newest first. */
export async function listSellerVideos(customerId: string) {
	const store = await requireStoreForCustomer(customerId);
	const result = await dbQuery<VideoRow>(
		`SELECT ${VIDEO_COLUMNS} FROM seller_videos WHERE store_id = $1 ORDER BY created_at DESC LIMIT ${MAX_SELLER_VIDEOS}`,
		[store.id],
	);
	return result.rows.map(toVideo);
}

const addVideoSchema = z.object({
	aspect: z.enum(VIDEO_ASPECTS),
	durationSeconds: z.coerce.number().min(1).max(60),
	productId: z.string().uuid().optional(),
	template: z.enum(VIDEO_TEMPLATES),
	title: z.string().trim().max(120).default(""),
});

/**
 * Save a rendered video (multipart: `file`, optional `poster` image,
 * `title`, `template`, `aspect`, `durationSeconds`, `productId`).
 */
export async function addSellerVideo(customerId: string, form: FormData) {
	const store = await requireStoreForCustomer(customerId);
	const parsed = addVideoSchema.safeParse({
		aspect: form.get("aspect"),
		durationSeconds: form.get("durationSeconds"),
		productId: form.get("productId") || undefined,
		template: form.get("template"),
		title: form.get("title") ?? "",
	});
	if (!parsed.success) throw new HttpError(400, "That video's details look wrong - render it again.", "INVALID_FIELD");
	const input = parsed.data;

	const count = await dbQuery<{ total: number }>(`SELECT count(*)::int AS total FROM seller_videos WHERE store_id = $1`, [store.id]);
	if ((count.rows[0]?.total ?? 0) >= MAX_SELLER_VIDEOS) {
		throw new HttpError(409, `You can keep up to ${MAX_SELLER_VIDEOS} videos - delete an old one first.`, "TOO_MANY_VIDEOS");
	}
	// Only a product actually in this store can be attached.
	let productId: string | null = null;
	if (input.productId) {
		const owned = await dbQuery(`SELECT 1 FROM reseller_listings WHERE store_id = $1 AND product_id = $2`, [store.id, input.productId]);
		productId = owned.rowCount ? input.productId : null;
	}

	const video = await storeVideoFile(form.get("file"));
	const poster = form.get("poster");
	const posterUrl = poster instanceof File && poster.size > 0 ? await storeUploadedImage(poster) : "";

	const result = await dbQuery<VideoRow>(
		`INSERT INTO seller_videos (store_id, product_id, video_url, poster_url, title, template, aspect, duration_seconds, size_bytes)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		RETURNING ${VIDEO_COLUMNS}`,
		[store.id, productId, video.url, posterUrl, input.title, input.template, input.aspect, input.durationSeconds, video.sizeBytes],
	);
	return toVideo(result.rows[0]);
}

/** Remove one of the seller's own videos from their library. */
export async function deleteSellerVideo(customerId: string, videoId: string) {
	if (!z.string().uuid().safeParse(videoId).success) throw new HttpError(404, "Video not found.", "NOT_FOUND");
	const store = await requireStoreForCustomer(customerId);
	const result = await dbQuery(`DELETE FROM seller_videos WHERE id = $1 AND store_id = $2`, [videoId, store.id]);
	if (!result.rowCount) throw new HttpError(404, "Video not found.", "NOT_FOUND");
}
