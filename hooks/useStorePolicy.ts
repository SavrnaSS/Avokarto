"use client";

import { useEffect, useSyncExternalStore } from "react";
import {
	DEFAULT_STORE_POLICY,
	getStorePolicy,
	setStorePolicy,
	type StorePolicy,
	subscribeStorePolicy,
} from "@/lib/storePolicy";

const CACHE_KEY = "avk-store-policy";
let loading: Promise<void> | null = null;

function readCache(): StorePolicy | null {
	try {
		const raw = window.localStorage.getItem(CACHE_KEY);
		return raw ? (JSON.parse(raw) as StorePolicy) : null;
	} catch {
		return null;
	}
}

/** Loads the live policy once per page load (the last one seen is applied first). */
function load() {
	if (loading) return loading;
	const cached = readCache();
	if (cached?.freeShipping && Array.isArray(cached.paymentMethods)) setStorePolicy(cached);
	loading = fetch("/api/store-policy", { credentials: "same-origin" })
		.then((response) => (response.ok ? response.json() : null))
		.then((payload: { data?: StorePolicy } | null) => {
			if (!payload?.data) return;
			setStorePolicy(payload.data);
			try {
				window.localStorage.setItem(CACHE_KEY, JSON.stringify(payload.data));
			} catch {
				// Storage blocked: the next page just fetches again.
			}
		})
		.catch(() => {
			// Offline: keep the defaults / last known values. Checkout re-checks on the server.
			loading = null;
		});
	return loading;
}

/**
 * The admin's free-shipping and payment settings. Starts from the defaults
 * (so server and first client render match), then switches to the live
 * values; components using it re-render when they arrive.
 */
export function useStorePolicy(): StorePolicy {
	const policy = useSyncExternalStore(subscribeStorePolicy, getStorePolicy, () => DEFAULT_STORE_POLICY);
	useEffect(() => {
		void load();
	}, []);
	return policy;
}
