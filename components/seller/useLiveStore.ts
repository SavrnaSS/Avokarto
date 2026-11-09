"use client";

import { useEffect, useRef, useState } from "react";
import type { StoreTheme } from "@/lib/storeThemes";

type StoreLook = {
	accent: string;
	/** Changing it re-aims the view, since each device lays the page out differently. */
	device: string;
	/** Which part of the store to show: the top, or the products and their prices. */
	focus?: "products" | "top";
	/** Prices the demo products at this margin (percent); the demo's default when omitted. */
	margin?: number;
	name: string;
	theme: StoreTheme;
};

/**
 * Connects an iframe to the /store-preview demo store. Theme, colour and name
 * are posted to it - the same message the seller's Theme Studio uses - so it
 * restyles in place without reloading.
 */
export function useLiveStore({ accent, device, focus = "top", margin, name, theme }: StoreLook) {
	const frame = useRef<HTMLIFrameElement>(null);
	const [ready, setReady] = useState(0);
	const [frameLoad, setFrameLoad] = useState(0);
	// The look at mount goes in the URL so the server renders it and the first
	// paint is already right. Frozen: later changes are posted, never a reload.
	const [src] = useState(() => {
		const query = new URLSearchParams({ accent, name, theme });
		if (margin !== undefined) query.set("margin", String(margin));
		return `/store-preview?${query}`;
	});

	// The demo store says "paint" as soon as its server HTML shows (ends the
	// shimmer) and "ready" once hydrated, on every (re)load; answer with the look.
	useEffect(() => {
		const onMessage = (event: MessageEvent) => {
			if (event.origin !== window.location.origin || event.source !== frame.current?.contentWindow) return;
			if ((event.data as { source?: string } | null)?.source === "avk-store") setReady((count) => count + 1);
		};
		window.addEventListener("message", onMessage);
		return () => window.removeEventListener("message", onMessage);
	}, []);

	// Sent on every change and again on every "ready"/load - harmless if the
	// page isn't listening yet, and nothing depends on one handshake.
	useEffect(() => {
		frame.current?.contentWindow?.postMessage({ accent, margin, name, source: "avk-theme-studio", theme }, window.location.origin);
	}, [accent, frameLoad, margin, name, ready, theme]);

	// The preview follows the job in hand, so a margin change shows on real prices.
	useEffect(() => {
		const view = frame.current?.contentWindow;
		const page = frame.current?.contentDocument;
		if (!view || !page) return;
		const target = focus === "products" ? page.querySelector('[data-st="featured"], #shop') : null;
		const header = page.querySelector("header")?.getBoundingClientRect().height ?? 72;
		const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
		view.scrollTo({ behavior: calm ? "auto" : "smooth", top: target ? target.getBoundingClientRect().top + view.scrollY - header : 0 });
	}, [device, focus, frameLoad, ready]);

	return { frame, frameLoad, onLoad: () => setFrameLoad((count) => count + 1), ready, src };
}
