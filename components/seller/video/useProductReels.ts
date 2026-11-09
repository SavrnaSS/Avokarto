"use client";

import { useEffect, useState } from "react";

/**
 * Real promo reels for the products that have one, matched by product name.
 * A reel replaces the still photo in the video studio: the canvas draws its
 * current frame on every tick, so the preview plays it and the recorder
 * captures it. Silent and same-origin, so the canvas can still be recorded.
 */
const REELS: { match: RegExp; src: string }[] = [
	{ match: /paw ops/i, src: "/assets/videos/reel-dog-outfit.mp4" },
	{ match: /cozycarry/i, src: "/assets/videos/reel-cozycarry.mp4" },
];

export function reelFor(productName: string) {
	return REELS.find((reel) => reel.match.test(productName))?.src ?? null;
}

const players = new Map<string, HTMLVideoElement>();

function player(src: string) {
	let video = players.get(src);
	if (!video) {
		video = document.createElement("video");
		video.muted = true;
		video.loop = true;
		video.playsInline = true;
		video.preload = "auto";
		video.src = src;
		players.set(src, video);
	}
	return video;
}

/** Ready-to-draw reels by source; a reel appears once its first frame is decoded. */
export function useProductReels(sources: string[], playing: boolean) {
	const key = sources.join("\n");
	const [ready, setReady] = useState<Record<string, HTMLVideoElement>>({});

	useEffect(() => {
		const list = key ? key.split("\n") : [];
		const cleanups = list.map((src) => {
			const video = player(src);
			const markReady = () => setReady((current) => (current[src] ? current : { ...current, [src]: video }));
			if (video.readyState >= 2) markReady();
			video.addEventListener("loadeddata", markReady);
			return () => video.removeEventListener("loadeddata", markReady);
		});
		return () => cleanups.forEach((cleanup) => cleanup());
	}, [key]);

	useEffect(() => {
		const list = key ? key.split("\n") : [];
		for (const src of list) {
			const video = player(src);
			if (playing) void video.play().catch(() => undefined);
			else video.pause();
		}
		return () => {
			for (const src of list) players.get(src)?.pause();
		};
	}, [key, playing]);

	return ready;
}
