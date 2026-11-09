"use client";

import { useLiveResource } from "@/hooks/use-live-resource";
import type { Product } from "@/types/product";

/**
 * Keeps a single product detail page in sync with admin edits (description,
 * price, stock, ...) without a refresh - an admin saving Products > Edit
 * fires the same "products" NOTIFY every list-page live hook already
 * subscribes to, so this just re-fetches this one product on that signal.
 * Starts from the server-rendered `initialProduct` and only swaps it out
 * once a live fetch actually resolves, so there's no flash of empty state.
 */
export function useLiveProduct(initialProduct: Product) {
	// Only database-backed products have catalogId. Static template products
	// remain usable without producing a false 404 from the storefront API.
	const endpoint = initialProduct.catalogId
		? `/api/products/${encodeURIComponent(initialProduct.catalogId)}`
		: null;
	const { data, ...state } = useLiveResource<Product>({
		endpoint,
		initialData: initialProduct,
		topics: ["products"],
		retryAttempts: 2,
		deduplicate: true,
	});

	return {
		...state,
		isLive: Boolean(endpoint),
		product: data,
	};
}
