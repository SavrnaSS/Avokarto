"use client";

import { useCallback, useEffect, useState } from "react";
import { useCustomerSession } from "@/hooks/use-customer-session";

export type ReviewableProduct = {
	imageUrl: string;
	productId: string;
	productName: string;
	rating: number | null;
	review: string | null;
	sku: string;
	status: string | null;
	unitPrice: number;
};

type ReviewsResponse = {
	data?: ReviewableProduct[];
};

export function useCustomerReviews() {
	const customer = useCustomerSession((state) => state.customer);
	const [products, setProducts] = useState<ReviewableProduct[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const refresh = useCallback(async () => {
		if (!customer) {
			setProducts([]);
			setLoading(false);
			return;
		}

		try {
			const response = await fetch("/api/account/reviews", {
				cache: "no-store",
				credentials: "same-origin",
			});
			const payload = (await response.json().catch(() => ({}))) as ReviewsResponse;

			if (!response.ok) {
				throw new Error("Unable to load your reviews.");
			}

			setProducts(payload.data ?? []);
			setError(null);
		} catch (requestError) {
			setError(
				requestError instanceof Error
					? requestError.message
					: "Unable to load your reviews.",
			);
		} finally {
			setLoading(false);
		}
	}, [customer]);

	useEffect(() => {
		// eslint-disable-next-line react-hooks/set-state-in-effect
		void refresh();
	}, [refresh]);

	return { error, loading, products, refresh };
}
