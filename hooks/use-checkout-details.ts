"use client";

import { useSyncExternalStore } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type CheckoutDetails = {
	address1: string;
	city: string;
	country: string;
	email: string;
	name: string;
	notes: string;
	phone: string;
	postcode: string;
	shippingMethodId: string;
	state: string;
};

const EMPTY_DETAILS: CheckoutDetails = {
	address1: "",
	city: "",
	country: "",
	email: "",
	name: "",
	notes: "",
	phone: "",
	postcode: "",
	shippingMethodId: "",
	state: "",
};

type CheckoutDetailsState = CheckoutDetails & {
	reset: () => void;
	setField: <K extends keyof CheckoutDetails>(
		key: K,
		value: CheckoutDetails[K],
	) => void;
};

// Persisted (not just in-memory like useReviewTarget) because the real
// checkout is two separate page navigations - /checkout-shipping collects
// the address and shipping method, /checkout-payment reads it back. A plain
// zustand store would lose that state on the navigation's full page load.
export const useCheckoutDetails = create<CheckoutDetailsState>()(
	persist(
		(set) => ({
			...EMPTY_DETAILS,
			reset: () => set({ ...EMPTY_DETAILS }),
			setField: (key, value) =>
				set({ [key]: value } as Partial<CheckoutDetailsState>),
		}),
		{
			name: "avokarto-checkout-details",
			partialize: (state) => {
				const { reset: _reset, setField: _setField, ...details } = state;
				return details;
			},
			storage: createJSONStorage(() => sessionStorage),
		},
	),
);

function subscribeToHydration(onStoreChange: () => void) {
	const unsubscribeHydrate = useCheckoutDetails.persist.onHydrate(onStoreChange);
	const unsubscribeFinish = useCheckoutDetails.persist.onFinishHydration(onStoreChange);

	return () => {
		unsubscribeHydrate();
		unsubscribeFinish();
	};
}

function getHydrationSnapshot() {
	return useCheckoutDetails.persist.hasHydrated();
}

function getServerHydrationSnapshot() {
	return false;
}

/** True once sessionStorage has been read on the client - guards against redirecting away from /checkout-payment before we know whether details actually exist. */
export function useCheckoutDetailsHydrated() {
	return useSyncExternalStore(
		subscribeToHydration,
		getHydrationSnapshot,
		getServerHydrationSnapshot,
	);
}
