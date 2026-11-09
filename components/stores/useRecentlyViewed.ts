"use client";

import { useEffect, useMemo, useSyncExternalStore } from "react";

/*
 * Products a shopper recently opened in one store, newest first. Only slugs
 * are kept (per store, in this browser); prices and stock always come from
 * the server's current listings.
 */

const LIMIT = 12;
const EVENT = "avk-recent-change";
const keyFor = (handle: string) => `avk-recent:${handle}`;

function read(handle: string) {
	try {
		return window.localStorage.getItem(keyFor(handle)) ?? "";
	} catch {
		return "";
	}
}

function subscribe(onChange: () => void) {
	window.addEventListener("storage", onChange);
	window.addEventListener(EVENT, onChange);
	return () => {
		window.removeEventListener("storage", onChange);
		window.removeEventListener(EVENT, onChange);
	};
}

/** Record `slug` as viewed and return the store's recently viewed slugs (excluding it). */
export function useRecentlyViewed(handle: string, slug: string) {
	const raw = useSyncExternalStore(subscribe, () => read(handle), () => "");

	useEffect(() => {
		try {
			const previous = (JSON.parse(read(handle) || "[]") as unknown[]).filter((item): item is string => typeof item === "string");
			const next = [slug, ...previous.filter((item) => item !== slug)].slice(0, LIMIT);
			window.localStorage.setItem(keyFor(handle), JSON.stringify(next));
			window.dispatchEvent(new Event(EVENT));
		} catch {
			// Storage blocked (private mode): the section just stays hidden.
		}
	}, [handle, slug]);

	return useMemo(() => {
		try {
			const list = JSON.parse(raw || "[]") as unknown[];
			return list.filter((item): item is string => typeof item === "string" && item !== slug);
		} catch {
			return [];
		}
	}, [raw, slug]);
}

/** The store's recently viewed slugs, newest first, without recording anything (store home). */
export function useRecentSlugs(handle: string) {
	const raw = useSyncExternalStore(subscribe, () => read(handle), () => "");
	return useMemo(() => {
		try {
			const list = JSON.parse(raw || "[]") as unknown[];
			return list.filter((item): item is string => typeof item === "string");
		} catch {
			return [];
		}
	}, [raw]);
}
