"use client";

import { useLiveResource } from "./use-live-resource";
import type { PublicCoupon } from "@/lib/backend/storefront-data";

const EMPTY_COUPONS: PublicCoupon[] = [];

export function useLiveCoupons() {
	const { data, ...state } = useLiveResource({
		endpoint: "/api/coupons",
		initialData: EMPTY_COUPONS,
		topics: ["coupons"],
		retryAttempts: 2,
		deduplicate: true,
	});

	return { ...state, coupons: data };
}
