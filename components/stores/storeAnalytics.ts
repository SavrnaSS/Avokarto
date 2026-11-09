"use client";

import { classifySource, type TrafficSource } from "@/lib/storeTraffic";

type StoreEvent = "add_to_cart" | "view_product" | "view_store";

// A random browser id that rotates daily - enough to count unique visitors,
// never enough to follow anyone. The server hashes it with the store handle.
function visitorId() {
	const today = new Date().toISOString().slice(0, 10);
	try {
		const saved = JSON.parse(localStorage.getItem("avk-visitor") ?? "null") as { day: string; id: string } | null;
		if (saved?.day === today && saved.id) return saved.id;
		const id = crypto.randomUUID();
		localStorage.setItem("avk-visitor", JSON.stringify({ day: today, id }));
		return id;
	} catch {
		// Storage blocked: a per-page id still lets views be counted.
		return crypto.randomUUID();
	}
}

// First-touch source for this browsing session, per store.
function visitSource(handle: string): TrafficSource {
	const key = `avk-source:${handle}`;
	try {
		const saved = sessionStorage.getItem(key) as TrafficSource | null;
		if (saved) return saved;
		const source = classifySource(window.location.search, document.referrer, window.location.host);
		sessionStorage.setItem(key, source);
		return source;
	} catch {
		return classifySource(window.location.search, document.referrer, window.location.host);
	}
}

/** Fire-and-forget storefront analytics. Never throws, never blocks. */
export function trackStoreEvent(handle: string, event: StoreEvent, productSlug?: string) {
	if (typeof window === "undefined") return;
	try {
		// Honour Global Privacy Control.
		if ((navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl) return;
		// The seller's own Theme Studio preview (an iframe) isn't a visit.
		if (window.self !== window.top) return;
		const body = JSON.stringify({ event, handle, productSlug, source: visitSource(handle), visitorId: visitorId() });
		const blob = new Blob([body], { type: "text/plain" });
		if (!navigator.sendBeacon?.("/api/stores/events", blob)) {
			void fetch("/api/stores/events", { body, credentials: "same-origin", keepalive: true, method: "POST" }).catch(() => undefined);
		}
	} catch {
		// Analytics must never affect shopping.
	}
}
