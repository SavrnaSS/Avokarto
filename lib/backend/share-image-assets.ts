import { readFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { readUpload } from "@/lib/backend/upload-storage";

/*
 * Images for generated share cards (next/og). Satori can't decode WebP and
 * fetches remote URLs itself without limits, so every image is loaded here,
 * resized with sharp and inlined as a data URL. A missing or broken image
 * returns null and the card simply leaves it out.
 */

const MAX_BYTES = 10 * 1024 * 1024;
const FETCH_TIMEOUT_MS = 5000;
const publicDir = path.join(process.cwd(), "public");

async function streamToBuffer(body: ReadableStream<Uint8Array> | Uint8Array) {
	if (body instanceof Uint8Array) return Buffer.from(body);
	const chunks: Uint8Array[] = [];
	let size = 0;
	const reader = body.getReader();
	for (;;) {
		const { done, value } = await reader.read();
		if (done) break;
		size += value.byteLength;
		if (size > MAX_BYTES) {
			await reader.cancel();
			throw new Error("Image too large");
		}
		chunks.push(value);
	}
	return Buffer.concat(chunks);
}

async function loadBytes(src: string) {
	const upload = /^\/api\/uploads\/([a-f0-9-]+\.(?:jpg|png|webp))$/.exec(src);
	if (upload) {
		const stored = await readUpload(upload[1]);
		return stored ? streamToBuffer(stored.body) : null;
	}
	if (src.startsWith("/")) {
		// Files shipped in public/ (catalog images like /assets/images/...).
		const file = path.normalize(path.join(publicDir, decodeURIComponent(src.split("?")[0])));
		if (!file.startsWith(publicDir + path.sep)) return null;
		return readFile(file);
	}
	if (/^https:\/\//.test(src)) {
		const response = await fetch(src, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
		if (!response.ok || !response.body) return null;
		if (Number(response.headers.get("content-length") ?? 0) > MAX_BYTES) return null;
		return streamToBuffer(response.body);
	}
	return null;
}

/**
 * Load an image as a data URL sized to fit `width`×`height` (cover crop).
 * `transparent` keeps PNG alpha for logos; photos become compact JPEGs.
 */
export async function shareImageDataUrl(
	src: string | null | undefined,
	{ height, transparent = false, width }: { height: number; transparent?: boolean; width: number },
) {
	if (!src) return null;
	try {
		const bytes = await loadBytes(src);
		if (!bytes?.length) return null;
		const image = sharp(bytes, { failOn: "none" }).rotate().resize(width, height, { fit: transparent ? "inside" : "cover" });
		const output = transparent ? await image.png().toBuffer() : await image.jpeg({ mozjpeg: true, quality: 82 }).toBuffer();
		return `data:image/${transparent ? "png" : "jpeg"};base64,${output.toString("base64")}`;
	} catch {
		return null;
	}
}
