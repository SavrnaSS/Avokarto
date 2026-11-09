import { NextRequest } from "next/server";
import { HttpError, handleApiError } from "@/lib/backend/http";
import { RangeNotSatisfiableError, readUpload, type ByteRange } from "@/lib/backend/upload-storage";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Uploads are always served from here rather than a static path: Next.js
// snapshots public/ at boot (runtime writes would be invisible), and with
// UPLOAD_STORAGE=s3 the bytes live in a bucket. The URL stays the same for
// every storage driver - see lib/backend/upload-storage.ts.
const CONTENT_TYPE_BY_EXTENSION: Record<string, string> = {
	jpg: "image/jpeg",
	mp4: "video/mp4",
	png: "image/png",
	// Seller-made videos from browsers that can't record MP4 (see lib/backend/seller-videos.ts).
	webm: "video/webm",
	webp: "image/webp",
};
const FILENAME_PATTERN = /^[a-f0-9-]+\.(jpg|png|webp|mp4|webm)$/i;

type RouteContext = {
	params: Promise<{ filename: string }>;
};

/**
 * "bytes=500-" / "bytes=500-999" (single ranges only - all browsers use
 * those for media). Suffix ranges ("bytes=-500") are rare; they get the
 * whole file, which is still a valid answer to a Range request.
 */
function parseRange(header: string | null): ByteRange | undefined {
	const match = /^bytes=(\d+)-(\d*)$/.exec(header?.trim() ?? "");
	if (!match) return undefined;
	return { end: match[2] ? Number(match[2]) : undefined, start: Number(match[1]) };
}

/** ?download=dog-backpack-reel.mp4 → a safe attachment file name, or null. */
function downloadName(request: NextRequest, extension: string) {
	const raw = request.nextUrl.searchParams.get("download");
	if (raw === null) return null;
	const base = raw.replace(/\.[a-z0-9]+$/i, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
	return `${base || "avokarto"}.${extension}`;
}

export async function GET(request: NextRequest, { params }: RouteContext) {
	try {
		const { filename } = await params;

		if (!FILENAME_PATTERN.test(filename)) {
			throw new HttpError(400, "Invalid file name.", "INVALID_FILENAME");
		}

		const extension = filename.split(".").pop()?.toLowerCase() ?? "";
		const contentType = CONTENT_TYPE_BY_EXTENSION[extension];
		// Videos stream and seek through byte ranges; images are served whole.
		const isVideo = extension === "mp4";
		const range = isVideo ? parseRange(request.headers.get("range")) : undefined;
		const upload = contentType ? await readUpload(filename, range) : null;

		if (!upload) {
			throw new HttpError(404, "File not found.", "NOT_FOUND");
		}

		const headers: Record<string, string> = {
			// File names are random UUIDs and never reused.
			"Cache-Control": "public, max-age=31536000, immutable",
			"Content-Type": contentType,
			"X-Content-Type-Options": "nosniff",
		};
		if (isVideo) headers["Accept-Ranges"] = "bytes";
		if (upload.contentLength !== undefined) {
			headers["Content-Length"] = String(upload.contentLength);
		}
		const attachment = downloadName(request, extension);
		if (attachment) headers["Content-Disposition"] = `attachment; filename="${attachment}"`;

		if (upload.range) {
			headers["Content-Range"] = `bytes ${upload.range.start}-${upload.range.end}/${upload.range.total}`;
			return new Response(upload.body as BodyInit, { headers, status: 206 });
		}
		return new Response(upload.body as BodyInit, { headers });
	} catch (error) {
		if (error instanceof RangeNotSatisfiableError) {
			return new Response(null, { headers: { "Content-Range": `bytes */${error.total}` }, status: 416 });
		}
		return handleApiError(error);
	}
}
