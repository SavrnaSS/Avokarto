"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { subscribeRealtime } from "@/lib/realtime-channel";

export type ProductReview = {
	createdAt: string;
	customerName: string;
	id: string;
	rating: number;
	review: string;
};

export type ProductReviewSummary = {
	average: number;
	breakdown: Record<1 | 2 | 3 | 4 | 5, number>;
	reviews: ProductReview[];
	total: number;
};

type ApiResponse = {
	data?: ProductReviewSummary;
	error?: {
		message?: string;
	};
};

const EMPTY_SUMMARY: ProductReviewSummary = {
	average: 0,
	breakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
	reviews: [],
	total: 0,
};

/**
 * Approved reviews for one product, live - an admin approving/unapproving a
 * review pushes a "reviews" realtime event that refetches this product's
 * summary, so the storefront reflects moderation decisions without a
 * page reload.
 */
export function useProductReviews(productId: string | number | undefined) {
	const [summary, setSummary] = useState<ProductReviewSummary>(EMPTY_SUMMARY);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const requestRef = useRef<AbortController | null>(null);

	const refresh = useCallback(async () => {
		requestRef.current?.abort();
		requestRef.current = null;

		if (productId === undefined) {
			setSummary(EMPTY_SUMMARY);
			setError(null);
			setLoading(false);
			return;
		}
		const controller = new AbortController();
		requestRef.current = controller;

		try {
			const response = await fetch(`/api/products/${productId}/reviews`, {
				cache: "no-store",
				signal: controller.signal,
			});
			const payload = (await response.json().catch(() => ({}))) as ApiResponse;
			if (requestRef.current !== controller) return;

			if (!response.ok) {
				throw new Error(
					payload.error?.message ?? `Reviews request failed: ${response.status}`,
				);
			}

			if (payload.data) {
				setSummary(payload.data);
			}

			setError(null);
		} catch (requestError) {
			if (requestRef.current !== controller) return;
			setError(
				requestError instanceof Error
					? requestError.message
					: "Unable to load reviews.",
			);
		} finally {
			if (requestRef.current === controller) {
				requestRef.current = null;
				setLoading(false);
			}
		}
	}, [productId]);

	useEffect(() => {
		// eslint-disable-next-line react-hooks/set-state-in-effect
		void refresh();
		return () => {
			requestRef.current?.abort();
			requestRef.current = null;
		};
	}, [refresh]);

	useEffect(() => {
		if (productId === undefined) return undefined;
		return subscribeRealtime("reviews", () => void refresh(), setError);
	}, [productId, refresh]);

	return { error, loading, refresh, summary };
}
