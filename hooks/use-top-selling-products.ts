"use client";

import { useLiveResource } from "./use-live-resource";
import type {
	TopSellingBasis,
	TopSellingPeriod,
	TopSellingProduct,
} from "@/lib/backend/storefront-data";

const EMPTY_RESULT: { basis: TopSellingBasis; items: TopSellingProduct[] } = {
	basis: "sales",
	items: [],
};

export function useTopSellingProducts({
	limit = 8,
	period,
	enabled = true,
}: {
	limit?: number;
	period: TopSellingPeriod;
	// false defers the request (and realtime subscription) until needed.
	enabled?: boolean;
}) {
	// order_items inserts (checkout) fire the same "products" NOTIFY topic
	// products.ts already reacts to (see database/migrations/001_init.sql) -
	// subscribing here means a brand-new sale reshuffles this section for
	// every visitor within moments, no page reload needed. "products" is
	// also the one sales-adjacent topic that's public (no customer/admin
	// session required), which a homepage section needs.
	const { data, ...state } = useLiveResource({
		endpoint: enabled
			? `/api/products/top-selling?period=${period}&limit=${limit}`
			: null,
		initialData: EMPTY_RESULT,
		topics: ["products"],
		retryAttempts: 2,
		deduplicate: true,
	});

	return { ...state, basis: data.basis, products: data.items };
}
