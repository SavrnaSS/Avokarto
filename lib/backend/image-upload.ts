import { randomUUID } from "node:crypto";
import { HttpError } from "@/lib/backend/http";
import { saveUpload } from "@/lib/backend/upload-storage";

const EXTENSION_BY_TYPE: Record<string, string> = {
	"image/jpeg": "jpg",
	"image/png": "png",
	"image/webp": "webp",
};

/** What every stored upload URL looks like - see app/api/uploads/[filename]. */
export const UPLOAD_URL_PATTERN = /^\/api\/uploads\/[a-f0-9-]+\.(jpg|png|webp)$/;

// The browser-reported MIME type is client-controlled, so the file's own
// signature must agree with it before anything is stored.
function hasImageSignature(bytes: Buffer, extension: string) {
	switch (extension) {
		case "jpg":
			return bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
		case "png":
			return bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
		case "webp":
			return bytes.subarray(0, 4).toString("ascii") === "RIFF" && bytes.subarray(8, 12).toString("ascii") === "WEBP";
		default:
			return false;
	}
}

/**
 * Validate an uploaded image from a multipart form and store it under a
 * server-generated name. Returns its public /api/uploads/... URL.
 */
export async function storeUploadedImage(file: unknown, { maxBytes = 5 * 1024 * 1024 } = {}) {
	if (!(file instanceof File)) {
		throw new HttpError(400, "No file was uploaded.", "MISSING_FILE");
	}

	const extension = EXTENSION_BY_TYPE[file.type];
	if (!extension) {
		throw new HttpError(415, "Only JPEG, PNG, or WebP images are accepted.", "UNSUPPORTED_TYPE");
	}

	if (file.size > maxBytes) {
		throw new HttpError(413, `Image must be ${Math.round(maxBytes / 1024 / 1024)}MB or smaller.`, "FILE_TOO_LARGE");
	}

	const bytes = Buffer.from(await file.arrayBuffer());
	if (!hasImageSignature(bytes, extension)) {
		throw new HttpError(415, "That file isn't a valid JPEG, PNG, or WebP image.", "UNSUPPORTED_TYPE");
	}

	const filename = `${randomUUID()}.${extension}`;
	await saveUpload(filename, bytes, file.type);
	return `/api/uploads/${filename}`;
}
