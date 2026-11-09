"use client";

import { useState } from "react";
import { uploadProblem } from "@/admin/hooks/use-image-gallery";

type UploadResponse = {
	error?: { message?: string };
	url?: string;
};

function readImageDimensions(src: string): Promise<{ height: number; width: number } | null> {
	return new Promise((resolve) => {
		const img = new Image();
		img.onload = () => resolve({ height: img.naturalHeight, width: img.naturalWidth });
		img.onerror = () => resolve(null);
		img.src = src;
	});
}

export function useImageUpload(
	initialUrl = "",
	initialDimensions?: { height?: number | null; width?: number | null },
) {
	const [url, setUrl] = useState(initialUrl);
	const [preview, setPreview] = useState(initialUrl);
	const [uploading, setUploading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [width, setWidth] = useState<number | null>(initialDimensions?.width ?? null);
	const [height, setHeight] = useState<number | null>(initialDimensions?.height ?? null);

	async function upload(file: File) {
		const problem = uploadProblem(file);
		if (problem) {
			setError(problem);
			return;
		}

		// Instant local preview while the real upload is in flight - if the
		// upload fails, url stays at its last-good value so Save still
		// submits the existing image instead of a broken/blob reference.
		const objectUrl = URL.createObjectURL(file);
		setPreview(objectUrl);
		setUploading(true);
		setError(null);

		// The real aspect ratio is read from the file itself so the
		// storefront can render it uncropped - independent of the upload
		// request, so it's still known even if the upload later fails.
		void readImageDimensions(objectUrl).then((dimensions) => {
			if (dimensions) {
				setWidth(dimensions.width);
				setHeight(dimensions.height);
			}
		});

		try {
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

			setUrl(payload.url);
			setPreview(payload.url);
		} catch (uploadError) {
			setError(
				uploadError instanceof Error ? uploadError.message : "Image upload failed.",
			);
			setPreview(url);
		} finally {
			setUploading(false);
			// The dimensions read above has finished with it by now or never will.
			window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
		}
	}

	function clear() {
		setUrl("");
		setPreview("");
		setError(null);
		setWidth(null);
		setHeight(null);
	}

	return { clear, error, height, preview, upload, uploading, url, width };
}
