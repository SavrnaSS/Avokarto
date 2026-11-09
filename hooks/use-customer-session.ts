"use client";

import { create } from "zustand";

export type Customer = {
	email: string;
	name: string;
	sub: string;
};

type MeResponse = {
	customer?: Customer | null;
};

type CustomerSessionState = {
	customer: Customer | null;
	hydrated: boolean;
	loading: boolean;
	logout: () => Promise<void>;
	refresh: () => Promise<void>;
	setCustomer: (customer: Customer | null) => void;
};

// Zustand, not React Context - same pattern as the existing cart/wishlist
// store (context/store.ts). Any component (header, signin/signup modals,
// account pages) reading this hook shares the exact same state, so signing
// in from a modal instantly updates the header with no prop drilling and
// no provider wrapper needed.
export const useCustomerSession = create<CustomerSessionState>((set) => ({
	customer: null,
	hydrated: false,
	loading: true,
	logout: async () => {
		await fetch("/api/account/logout", {
			credentials: "same-origin",
			method: "POST",
		}).catch(() => undefined);
		set({ customer: null, hydrated: true, loading: false });
	},
	refresh: async () => {
		try {
			const response = await fetch("/api/account/me", {
				cache: "no-store",
				credentials: "same-origin",
			});
			const payload = (await response.json().catch(() => ({}))) as MeResponse;
			set({ customer: payload.customer ?? null, hydrated: true, loading: false });
		} catch {
			set({ customer: null, hydrated: true, loading: false });
		}
	},
	setCustomer: (customer) => set({ customer, hydrated: true, loading: false }),
}));
