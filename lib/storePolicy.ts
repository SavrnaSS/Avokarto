/**
 * Store rules the admin sets in Settings (Shipping, Payments) and every
 * storefront screen follows. Shared by server and browser code - no server
 * imports here. The server reads the live values from the database
 * (lib/backend/store-policy.ts); the browser loads them from
 * /api/store-policy via hooks/useStorePolicy.ts and keeps them in this
 * module, so screens that compute prices in render all agree.
 */

export const PAYMENT_METHODS = [
	{ key: "card", label: "Credit or debit card", note: "Visa, Mastercard, Amex" },
	{ key: "paypal", label: "PayPal", note: "Pay with a PayPal account" },
	{ key: "googlepay", label: "Google Pay", note: "Fast, on supported devices" },
	{ key: "cod", label: "Cash on delivery", note: "Pay when it arrives" },
] as const;

export type PaymentMethodKey = (typeof PAYMENT_METHODS)[number]["key"];

export type StorePolicy = {
	freeShipping: { enabled: boolean; thresholdUsd: number };
	paymentMethods: PaymentMethodKey[];
};

export const DEFAULT_STORE_POLICY: StorePolicy = {
	freeShipping: { enabled: true, thresholdUsd: 100 },
	paymentMethods: PAYMENT_METHODS.map((method) => method.key),
};

export function isPaymentMethodKey(value: unknown): value is PaymentMethodKey {
	return PAYMENT_METHODS.some((method) => method.key === value);
}

/** The method a checkout submitted ("card", "Credit or debit card", "Google Pay"...), or null if it isn't one we know. */
export function paymentMethodKeyOf(value: string): PaymentMethodKey | null {
	const clean = value.trim().toLowerCase().replace(/[^a-z]/g, "");
	for (const method of PAYMENT_METHODS) {
		if (clean === method.key || clean === method.label.toLowerCase().replace(/[^a-z]/g, "")) return method.key;
	}
	return null;
}

let current: StorePolicy = DEFAULT_STORE_POLICY;
const listeners = new Set<() => void>();

export function getStorePolicy() {
	return current;
}

export function setStorePolicy(next: StorePolicy) {
	if (JSON.stringify(next) === JSON.stringify(current)) return;
	current = next;
	listeners.forEach((listener) => listener());
}

export function subscribeStorePolicy(listener: () => void) {
	listeners.add(listener);
	return () => {
		listeners.delete(listener);
	};
}
