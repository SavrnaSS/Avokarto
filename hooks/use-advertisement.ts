"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { subscribeRealtime } from "@/lib/realtime-channel";

export type Advertisement = {
	id: string;
	title: string;
	imageUrl: string;
	linkUrl: string;
	sortOrder: number;
};

type ApiResponse = {
	data?: Advertisement[];
	error?: {
		message?: string;
	};
};

/**
 * The single active banner ad to show in a product page's ad slot, or null
 * if the admin hasn't added one - never a placeholder image. Lowest
 * sort_order wins when more than one is active. Live: an admin adding,
 * editing, or deactivating a banner in /admin/advertisements updates this
 * on an already-open product page via the same "advertisements" realtime
 * topic every other live storefront list subscribes to.
 */
export function useAdvertisement() {
	const [advertisement, setAdvertisement] = useState<Advertisement | null>(null);
	const [error, setError] = useState<string | null>(null);
	const requestRef = useRef<AbortController | null>(null);

	const refresh = useCallback(async () => {
		requestRef.current?.abort();
		const controller = new AbortController();
		requestRef.current = controller;

		try {
			const response = await fetch("/api/advertisements", {
				cache: "no-store",
				credentials: "same-origin",
				signal: controller.signal,
			});
			const payload = (await response.json().catch(() => ({}))) as ApiResponse;
			if (requestRef.current !== controller) return;

			if (!response.ok) {
				throw new Error(
					payload.error?.message ?? `Advertisements request failed: ${response.status}`,
				);
			}

			setAdvertisement(payload.data?.[0] ?? null);
			setError(null);
		} catch (requestError) {
			if (requestRef.current !== controller) return;
			setError(
				requestError instanceof Error
					? requestError.message
					: "Unable to load advertisement.",
			);
		} finally {
			if (requestRef.current === controller) requestRef.current = null;
		}
	}, []);

	useEffect(() => {
		// eslint-disable-next-line react-hooks/set-state-in-effect
		void refresh();
		return () => {
			requestRef.current?.abort();
			requestRef.current = null;
		};
	}, [refresh]);

	useEffect(() => {
		return subscribeRealtime("advertisements", () => void refresh(), setError);
	}, [refresh]);

	return { advertisement, error };
}
