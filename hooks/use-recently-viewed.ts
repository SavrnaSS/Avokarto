"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { subscribeRealtime } from "@/lib/realtime-channel";
import { requestResource } from "@/lib/resource-request";
import type { Product } from "@/types/product";

const STORAGE_KEY = "unimart:recently-viewed";
const MAX_STORED = 12;
// Fired on window whenever this tab records a view, so every mounted
// recently-viewed list refreshes immediately. Other tabs are covered by the
// browser's native "storage" event.
const VIEW_EVENT = "unimart:recently-viewed-change";
const UUID_PATTERN =
	/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function readViewedIds(): string[] {
	if (typeof window === "undefined") return [];

	try {
		const raw = window.localStorage.getItem(STORAGE_KEY);
		const parsed = raw ? JSON.parse(raw) : [];
		return Array.isArray(parsed)
			? parsed.filter((id): id is string => typeof id === "string" && id.length > 0)
			: [];
	} catch {
		return [];
	}
}

function matchesId(product: Product, id: string) {
	return (
		product.catalogId === id ||
		String(product.id) === id ||
		product.slug === id ||
		product.sku === id
	);
}

/**
 * Synchronous - true if the visitor has at least one OTHER stored product
 * id (localStorage read, no network round trip). Lets the UI pick which
 * tab to default to (Recently Viewed vs Recommended) instantly instead of
 * waiting for the recently-viewed product fetch to resolve.
 */
export function hasStoredView(excludeId?: string): boolean {
	return readViewedIds().some((id) => id !== excludeId);
}

/**
 * Records that the visitor just looked at a product's detail page, so the
 * "Recently Viewed" rail can show their actual browsing history instead of a
 * fixed demo list. Client-only (localStorage) - there's no signed-in
 * customer identity to attach this to server-side, and it doesn't need one.
 */
export function recordProductView(id: string | undefined) {
	if (typeof window === "undefined" || !id) return;

	try {
		const previous = readViewedIds();
		if (previous[0] === id) return; // already the most recent - nothing changes
		const next = [id, ...previous.filter((existingId) => existingId !== id)].slice(
			0,
			MAX_STORED,
		);
		window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
		window.dispatchEvent(new Event(VIEW_EVENT));
	} catch {
		// localStorage unavailable (private browsing, quota) - recently-viewed
		// just won't persist for this visitor, which is a harmless degradation.
	}
}

/**
 * Resolves stored ids to live products, most recent first. Catalog UUIDs
 * (what every live product page records) go out as ONE batched list
 * request that the API returns in the requested order; anything else
 * (legacy numeric ids / slugs from older templates) falls back to a
 * per-product lookup. Requests are de-duplicated, so several lists on one
 * page asking for the same history share a single network call.
 */
async function resolveViewedProducts(
	ids: string[],
	signal: AbortSignal,
	refreshScope?: object,
): Promise<Product[]> {
	const catalogIds = ids.filter((id) => UUID_PATTERN.test(id));
	const otherIds = ids.filter((id) => !UUID_PATTERN.test(id));

	const [batch, singles] = await Promise.all([
		catalogIds.length
			? requestResource<Product[]>(
					`/api/products?catalogId=${catalogIds.join(",")}&limit=${catalogIds.length}`,
					{ signal, retryAttempts: 1, deduplicate: true, refreshScope },
				)
			: Promise.resolve([] as Product[]),
		Promise.all(
			otherIds.map((id) =>
				requestResource<Product>(`/api/products/${encodeURIComponent(id)}`, {
					signal,
					deduplicate: true,
					refreshScope,
				}).catch(() => null), // a since-removed product just drops out
			),
		),
	]);

	const pool = [...batch, ...singles.filter((product): product is Product => Boolean(product))];
	const seen = new Set<string>();
	const ordered: Product[] = [];

	// Rebuild in stored (recency) order and de-dupe by rendered identity:
	// two stored values (e.g. a legacy id and a UUID) can resolve to the
	// same product, which should appear once at its most recent position.
	for (const id of ids) {
		const product = pool.find((candidate) => matchesId(candidate, id));
		if (!product) continue;
		const key = product.catalogId ?? String(product.id);
		if (seen.has(key)) continue;
		seen.add(key);
		ordered.push(product);
	}

	return ordered;
}

/**
 * Resolves the visitor's recently-viewed ids into live product data - always
 * refetched (never trusts a stale localStorage snapshot for price/stock/
 * images), kept in sync with admin edits via the "products" realtime topic,
 * and refreshed whenever a view is recorded in this tab or another one.
 */
export function useRecentlyViewedProducts({
	enabled = true,
	excludeId,
	limit = 6,
}: {
	enabled?: boolean;
	excludeId?: string;
	limit?: number;
}) {
	const [products, setProducts] = useState<Product[]>([]);
	const [loading, setLoading] = useState(enabled);
	const [error, setError] = useState<string | null>(null);
	const [hasHistory, setHasHistory] = useState(false);
	const requestRef = useRef<AbortController | null>(null);
	// Ids behind the list currently shown; lets history-change events skip
	// a refetch when the visible slice didn't actually change (e.g. the view
	// just recorded is the excluded current product).
	const loadedKeyRef = useRef<string | null>(null);
	// Ids of the request in flight, if any - an event for the same slice
	// must not cancel it only to ask for the identical data again.
	const inFlightKeyRef = useRef<string | null>(null);

	const refresh = useCallback(
		async (refreshScope?: object, onlyIfChanged = false) => {
			if (onlyIfChanged && enabled) {
				const pendingKey = readViewedIds()
					.filter((id) => id !== excludeId)
					.slice(0, limit)
					.join(",");
				const shownOrLoading = requestRef.current
					? inFlightKeyRef.current
					: loadedKeyRef.current;
				if (pendingKey === shownOrLoading) return;
			}
			requestRef.current?.abort();
			requestRef.current = null;
			if (!enabled) {
				setProducts([]);
				setError(null);
				setHasHistory(false);
				setLoading(false);
				return;
			}

			const ids = readViewedIds()
				.filter((id) => id !== excludeId)
				.slice(0, limit);
			const idsKey = ids.join(",");
			setHasHistory(ids.length > 0);

			if (!ids.length) {
				loadedKeyRef.current = idsKey;
				setLoading(false);
				setProducts([]);
				setError(null);
				return;
			}
			const controller = new AbortController();
			requestRef.current = controller;
			inFlightKeyRef.current = idsKey;

			try {
				const resolved = await resolveViewedProducts(
					ids,
					controller.signal,
					refreshScope,
				);
				if (requestRef.current !== controller) return;
				loadedKeyRef.current = idsKey;
				// The current product can be stored under a different id form
				// than excludeId (slug vs UUID) - drop it by identity too.
				setProducts(
					excludeId
						? resolved.filter((product) => !matchesId(product, excludeId))
						: resolved,
				);
				setError(null);
			} catch (requestError) {
				if (requestRef.current !== controller || controller.signal.aborted) return;
				setError(
					requestError instanceof Error
						? requestError.message
						: "Unable to load recently viewed products.",
				);
			} finally {
				if (requestRef.current === controller) {
					requestRef.current = null;
					setLoading(false);
				}
			}
		},
		[enabled, excludeId, limit],
	);

	useEffect(() => {
		// eslint-disable-next-line react-hooks/set-state-in-effect
		void refresh();
		return () => {
			requestRef.current?.abort();
			requestRef.current = null;
		};
	}, [refresh]);

	useEffect(() => {
		if (!enabled) return undefined;
		const onLocalView = () => void refresh(undefined, true);
		const onStorage = (event: StorageEvent) => {
			// key === null means storage was cleared entirely.
			if (event.key === STORAGE_KEY || event.key === null) {
				void refresh(undefined, true);
			}
		};
		window.addEventListener(VIEW_EVENT, onLocalView);
		window.addEventListener("storage", onStorage);
		const unsubscribe = subscribeRealtime(
			"products",
			(refreshScope) => void refresh(refreshScope),
			setError,
		);
		return () => {
			window.removeEventListener(VIEW_EVENT, onLocalView);
			window.removeEventListener("storage", onStorage);
			unsubscribe();
		};
	}, [enabled, refresh]);

	// A failed refresh (timeout, offline) keeps showing the last good list;
	// retry once the visitor is back on the tab and online.
	useEffect(() => {
		if (!enabled || !error) return undefined;
		const retryOnReturn = () => {
			if (document.visibilityState === "visible" && navigator.onLine) {
				void refresh();
			}
		};
		window.addEventListener("online", retryOnReturn);
		document.addEventListener("visibilitychange", retryOnReturn);
		return () => {
			window.removeEventListener("online", retryOnReturn);
			document.removeEventListener("visibilitychange", retryOnReturn);
		};
	}, [enabled, error, refresh]);

	return { error, products, loading, hasHistory, refresh };
}

/** Forgets this visitor's browsing history (a shopper-facing "Clear" control). */
export function clearRecentlyViewed() {
	if (typeof window === "undefined") return;
	try {
		window.localStorage.removeItem(STORAGE_KEY);
		window.dispatchEvent(new Event(VIEW_EVENT));
	} catch {
		// Storage unavailable - nothing was persisted to clear.
	}
}
