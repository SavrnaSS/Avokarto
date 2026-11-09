"use client";

import { useState } from "react";

type GalleryImage = {
	error?: string | null;
	id: string;
	preview: string;
	uploading: boolean;
	url: string;
};

type UploadResponse = {
	error?: { message?: string };
	url?: string;
};

// Mirrors app/api/admin/uploads/route.ts and the server's gallery cap, so
// mistakes show up immediately instead of after an upload round trip.
export const MAX_GALLERY_IMAGES = 20;
const ACCEPTED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

export function uploadProblem(file: File) {
	if (!ACCEPTED_TYPES.has(file.type)) return "Only JPEG, PNG, or WebP images are accepted.";
	if (file.size > MAX_UPLOAD_BYTES) return "Image must be 5MB or smaller.";
	return null;
}

function randomId() {
	return typeof crypto.randomUUID === "function"
		? crypto.randomUUID()
		: `img-${Math.random().toString(36).slice(2)}`;
}

async function uploadFile(file: File) {
	const body = new FormData();
	body.append("file", file);

	const response = await fetch("/api/admin/uploads", {
		body,
		cache: "no-store",
		credentials: "include",
		method: "POST",
	});
	const payload = (await response.json().catch(() => ({}))) as UploadResponse;

	if (!response.ok || !payload.url) {
		throw new Error(payload.error?.message ?? "Image upload failed.");
	}

	return payload.url;
}

export function useImageGallery(initialUrls: string[]) {
	// Initial ids must be deterministic: this initializer runs on both the
	// server and the client, and the ids end up in DOM attributes (alt-text
	// input id/htmlFor), so random ids here cause a hydration mismatch.
	const [images, setImages] = useState<GalleryImage[]>(() =>
		initialUrls
			.filter(Boolean)
			.map((url, index) => ({ id: `initial-${index}`, preview: url, uploading: false, url })),
	);

	const [notice, setNotice] = useState<string | null>(null);

	function addFiles(files: FileList | File[]) {
		const room = MAX_GALLERY_IMAGES - images.length;
		const all = Array.from(files);
		const list = all.slice(0, Math.max(0, room));
		const rejected: string[] = [];

		if (all.length > list.length) {
			rejected.push(
				`A product can have at most ${MAX_GALLERY_IMAGES} images - ${all.length - list.length} not added.`,
			);
		}

		for (const file of list) {
			const problem = uploadProblem(file);
			if (problem) {
				rejected.push(`${file.name}: ${problem}`);
				continue;
			}

			const id = randomId();
			const objectUrl = URL.createObjectURL(file);
			setImages((current) => [
				...current,
				{ id, preview: objectUrl, uploading: true, url: "" },
			]);

			void uploadFile(file)
				.then((url) => {
					URL.revokeObjectURL(objectUrl);
					setImages((current) =>
						current.map((image) =>
							image.id === id
								? { ...image, error: null, preview: url, uploading: false, url }
								: image,
						),
					);
				})
				.catch((uploadError: unknown) => {
					setImages((current) =>
						current.map((image) =>
							image.id === id
								? {
										...image,
										error:
											uploadError instanceof Error
												? uploadError.message
												: "Image upload failed.",
										uploading: false,
									}
								: image,
						),
					);
				});
		}

		setNotice(rejected.length ? rejected.join(" ") : null);
	}

	function remove(id: string) {
		setImages((current) => current.filter((image) => image.id !== id));
	}

	// Pinning moves an image to index 0 - mutateProduct always treats the
	// first gallery entry as the product's main thumbnail (image_url).
	function pin(id: string) {
		setImages((current) => {
			const target = current.find((image) => image.id === id);

			if (!target) {
				return current;
			}

			return [target, ...current.filter((image) => image.id !== id)];
		});
	}

	const urls = images
		.filter((image) => image.url && !image.uploading)
		.map((image) => image.url);

	return { addFiles, images, notice, pin, remove, urls };
}
