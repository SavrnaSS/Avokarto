"use client";

import { useEffect, useState } from "react";

export type LoadedImage = { height: number; image: HTMLImageElement; width: number };

const cache = new Map<string, Promise<LoadedImage | null>>();

/**
 * Product photos for the video canvas, loaded through Next's image
 * optimiser: same-origin (a canvas with cross-origin pixels can't be
 * recorded), resized to video size, and decoded before drawing.
 */
function load(src: string) {
	let pending = cache.get(src);
	if (!pending) {
		pending = new Promise<LoadedImage | null>((resolve) => {
			const image = new Image();
			image.decoding = "async";
			image.onload = () => resolve({ height: image.naturalHeight || 1, image, width: image.naturalWidth || 1 });
			image.onerror = () => resolve(null);
			// q must be in next.config's images.qualities (Next 16 default: [75]) or the optimiser answers 400.
			image.src = `/_next/image?url=${encodeURIComponent(src)}&w=1080&q=75`;
		});
		cache.set(src, pending);
	}
	return pending;
}

/** Loaded images by source URL; missing entries are still loading (null = failed). */
export function useProductImages(sources: string[]) {
	const key = sources.join("\n");
	const [loaded, setLoaded] = useState<Record<string, LoadedImage | null>>({});
	useEffect(() => {
		let active = true;
		for (const src of key ? key.split("\n") : []) {
			void load(src).then((result) => {
				if (active) setLoaded((current) => (src in current ? current : { ...current, [src]: result }));
			});
		}
		return () => {
			active = false;
		};
	}, [key]);
	return loaded;
}
