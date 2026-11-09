"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { subscribeRealtime } from "@/lib/realtime-channel";

export type ShippingMethod = {
	carrier: string;
	deliveryEstimate: string;
	description: string;
	id: string;
	name: string;
	price: number;
};

type ApiResponse = {
	data?: ShippingMethod[];
	error?: {
		message?: string;
	};
};

export function useShippingMethods() {
	const [methods, setMethods] = useState<ShippingMethod[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const requestRef = useRef<AbortController | null>(null);

	const refresh = useCallback(async () => {
		requestRef.current?.abort();
		const controller = new AbortController();
		requestRef.current = controller;

		try {
			const response = await fetch("/api/shipping-methods", {
				cache: "no-store",
				credentials: "same-origin",
				signal: controller.signal,
			});
			const payload = (await response.json().catch(() => ({}))) as ApiResponse;
			if (requestRef.current !== controller) return;

			if (!response.ok) {
				throw new Error(
					payload.error?.message ?? `Shipping methods request failed: ${response.status}`,
				);
			}

			setMethods(payload.data ?? []);
			setError(null);
		} catch (requestError) {
			if (requestRef.current !== controller) return;
			setError(
				requestError instanceof Error
					? requestError.message
					: "Unable to load shipping methods.",
			);
		} finally {
			if (requestRef.current === controller) {
				requestRef.current = null;
				setLoading(false);
			}
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
		return subscribeRealtime("shipping-methods", () => void refresh(), setError);
	}, [refresh]);

	return { error, loading, methods, refresh };
}
