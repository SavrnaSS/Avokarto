"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { subscribeRealtime } from "@/lib/realtime-channel";
import { requestResource } from "@/lib/resource-request";
import type { Product } from "@/types/product";

// /api/products accepts at most 24 catalogId filters per request.
const CHUNK_SIZE = 24;
const UUID_PATTERN =
	/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type State = {
	key: string;
	products: Map<string, Product>;
	// The ids a successful response covered: a covered id with no product is
	// genuinely unavailable (deleted / unpublished / out of stock), not just
	// "not loaded yet".
	resolved: ReadonlySet<string>;
	loading: boolean;
	error: string | null;
};

const EMPTY_STATE: Omit<State, "key"> = {
	products: new Map(),
	resolved: new Set(),
	loading: false,
	error: null,
};

/**
 * Live catalog data for an arbitrary list of catalog UUIDs (e.g. a saved
 * wishlist): fetched in batched, de-duplicated requests of up to 24 ids,
 * refreshed on realtime "products" changes, and never trusting a stale
 * client-side snapshot for price, stock, title or image.
 */
export function useLiveProductsByIds(catalogIds: readonly string[]) {
	const ids = useMemo(
		() => [...new Set(catalogIds.filter((id) => UUID_PATTERN.test(id)))].sort(),
		[catalogIds],
	);
	const key = ids.join(",");
	const [state, setState] = useState<State>({ key: "", ...EMPTY_STATE });
	const requestRef = useRef<AbortController | null>(null);

	const load = useCallback(
		async (refreshScope?: object) => {
			requestRef.current?.abort();
			requestRef.current = null;
			if (!ids.length) {
				setState({ key, ...EMPTY_STATE });
				return;
			}

			const controller = new AbortController();
			requestRef.current = controller;
			setState((previous) => ({
				...(previous.key === key ? previous : { ...EMPTY_STATE }),
				key,
				loading: true,
				error: null,
			}));

			const chunks: string[][] = [];
			for (let index = 0; index < ids.length; index += CHUNK_SIZE) {
				chunks.push(ids.slice(index, index + CHUNK_SIZE));
			}

			try {
				const results = await Promise.all(
					chunks.map((chunk) =>
						requestResource<Product[]>(
							`/api/products?catalogId=${chunk.join(",")}&limit=${chunk.length}`,
							{
								signal: controller.signal,
								retryAttempts: 1,
								deduplicate: true,
								refreshScope,
							},
						),
					),
				);
				if (requestRef.current !== controller) return;
				const products = new Map<string, Product>();
				for (const product of results.flat()) {
					if (product.catalogId) products.set(product.catalogId, product);
				}
				setState({
					key,
					products,
					resolved: new Set(ids),
					loading: false,
					error: null,
				});
			} catch (error) {
				if (requestRef.current !== controller || controller.signal.aborted) return;
				// Keep the last good data; just surface the failure.
				setState((previous) => ({
					...previous,
					key,
					loading: false,
					error:
						error instanceof Error ? error.message : "Unable to load products.",
				}));
			} finally {
				if (requestRef.current === controller) requestRef.current = null;
			}
		},
		// `ids` is derived from `key`; depending on the string keeps this stable.
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[key],
	);

	useEffect(() => {
		void load();
		return () => {
			requestRef.current?.abort();
			requestRef.current = null;
		};
	}, [load]);

	useEffect(() => {
		if (!key) return undefined;
		return subscribeRealtime("products", (refreshScope) => void load(refreshScope));
	}, [key, load]);

	const current = state.key === key ? state : { key, ...EMPTY_STATE, loading: ids.length > 0 };
	return { ...current, refresh: () => void load() };
}
