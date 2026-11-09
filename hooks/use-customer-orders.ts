"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useCustomerSession } from "@/hooks/use-customer-session";
import { subscribeRealtime } from "@/lib/realtime-channel";

export type CustomerOrder = {
	createdAt: string;
	items: { imageUrl: string; name: string }[];
	orderNumber: string;
	status: string;
	total: number;
};

type OrdersResponse = {
	data?: CustomerOrder[];
	error?: { message?: string };
};

export function useCustomerOrders() {
	const customer = useCustomerSession((state) => state.customer);
	const [orders, setOrders] = useState<CustomerOrder[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const requestRef = useRef<AbortController | null>(null);

	const refresh = useCallback(async () => {
		requestRef.current?.abort();
		requestRef.current = null;

		if (!customer) {
			setOrders([]);
			setLoading(false);
			setError(null);
			return;
		}
		const controller = new AbortController();
		requestRef.current = controller;

		try {
			const response = await fetch("/api/account/orders", {
				cache: "no-store",
				credentials: "same-origin",
				signal: controller.signal,
			});
			const payload = (await response.json().catch(() => ({}))) as OrdersResponse;
			if (requestRef.current !== controller) return;

			if (!response.ok) {
				throw new Error(payload.error?.message ?? "Unable to load orders.");
			}

			setOrders(payload.data ?? []);
			setError(null);
		} catch (requestError) {
			if (requestRef.current !== controller) return;
			setError(
				requestError instanceof Error
					? requestError.message
					: "Unable to load orders.",
			);
		} finally {
			if (requestRef.current === controller) {
				requestRef.current = null;
				setLoading(false);
			}
		}
	}, [customer]);

	useEffect(() => {
		// eslint-disable-next-line react-hooks/set-state-in-effect
		void refresh();
		return () => {
			requestRef.current?.abort();
			requestRef.current = null;
		};
	}, [refresh]);

	useEffect(() => {
		if (!customer) {
			return;
		}

		return subscribeRealtime("orders", () => void refresh(), setError);
	}, [customer, refresh]);

	return { error, loading, orders, refresh };
}
