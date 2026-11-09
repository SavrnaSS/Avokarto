import { z } from "zod";
import { dbQuery } from "@/lib/backend/db";
import { HttpError } from "@/lib/backend/http";
import {
	DEFAULT_STORE_POLICY,
	isPaymentMethodKey,
	PAYMENT_METHODS,
	paymentMethodKeyOf,
	type StorePolicy,
} from "@/lib/storePolicy";

/* ------------------------------------------------------------------------
 * The live store rules from Admin -> Settings: free shipping, payment
 * methods at checkout, admin session length. Read on every checkout, so
 * they're kept for a few seconds per process and dropped on save.
 * --------------------------------------------------------------------- */

type PolicyRow = {
	admin_session_days: number | null;
	free_shipping_enabled: boolean;
	free_shipping_threshold: string;
	payment_methods: string[];
};

export type StoreSettingsPolicy = StorePolicy & { adminSessionDays: number };

const CACHE_MS = 15_000;
let cached: { at: number; value: StoreSettingsPolicy } | null = null;

/** ADMIN_SESSION_DAYS from the environment - the default until an admin sets one. */
export function defaultAdminSessionDays() {
	const days = Number(process.env.ADMIN_SESSION_DAYS ?? "7");
	return Number.isFinite(days) ? Math.min(30, Math.max(1, Math.round(days))) : 7;
}

export async function getStoreSettingsPolicy(): Promise<StoreSettingsPolicy> {
	if (cached && Date.now() - cached.at < CACHE_MS) return cached.value;
	const result = await dbQuery<PolicyRow>(
		"SELECT free_shipping_enabled, free_shipping_threshold, payment_methods, admin_session_days FROM store_settings WHERE id = 1",
	);
	const row = result.rows[0];
	const methods = (row?.payment_methods ?? []).filter(isPaymentMethodKey);
	const value: StoreSettingsPolicy = {
		adminSessionDays: row?.admin_session_days ?? defaultAdminSessionDays(),
		freeShipping: row
			? { enabled: row.free_shipping_enabled, thresholdUsd: Number(row.free_shipping_threshold) }
			: DEFAULT_STORE_POLICY.freeShipping,
		// Order of the list, not of the saved array, so checkouts stay consistent.
		paymentMethods: row ? PAYMENT_METHODS.map((method) => method.key).filter((key) => methods.includes(key)) : DEFAULT_STORE_POLICY.paymentMethods,
	};
	cached = { at: Date.now(), value };
	return value;
}

/** What the storefront needs (public): no admin settings. */
export async function getStorePolicyForStorefront(): Promise<StorePolicy> {
	const { freeShipping, paymentMethods } = await getStoreSettingsPolicy();
	return { freeShipping, paymentMethods };
}

/** Admin session length in seconds, for the login routes. */
export async function getAdminSessionMaxAge() {
	const days = await getStoreSettingsPolicy()
		.then((policy) => policy.adminSessionDays)
		.catch(() => defaultAdminSessionDays());
	return days * 24 * 60 * 60;
}

const shippingSchema = z.object({
	enabled: z.boolean(),
	thresholdUsd: z.coerce.number().min(0, "The minimum can't be negative.").max(100000, "That minimum is too high."),
});

export async function updateFreeShipping(body: unknown) {
	const input = shippingSchema.parse(body);
	await dbQuery("UPDATE store_settings SET free_shipping_enabled = $1, free_shipping_threshold = $2 WHERE id = 1", [
		input.enabled,
		Math.round(input.thresholdUsd * 100) / 100,
	]);
	cached = null;
	return getStoreSettingsPolicy();
}

const paymentsSchema = z.object({
	paymentMethods: z
		.array(z.string())
		.transform((list) => [...new Set(list.filter(isPaymentMethodKey))])
		.refine((list) => list.length > 0, "Keep at least one payment method switched on."),
});

export async function updatePaymentMethods(body: unknown) {
	const input = paymentsSchema.parse(body);
	await dbQuery("UPDATE store_settings SET payment_methods = $1 WHERE id = 1", [input.paymentMethods]);
	cached = null;
	return getStoreSettingsPolicy();
}

const sessionSchema = z.object({
	adminSessionDays: z.coerce.number().int("Whole days only.").min(1, "At least 1 day.").max(30, "At most 30 days."),
});

export async function updateAdminSessionDays(body: unknown) {
	const input = sessionSchema.parse(body);
	await dbQuery("UPDATE store_settings SET admin_session_days = $1 WHERE id = 1", [input.adminSessionDays]);
	cached = null;
	return getStoreSettingsPolicy();
}

/**
 * Checkout guard: a method the admin switched off is refused. Unknown labels
 * (or none - "pending") pass, so older clients can still place orders.
 */
export function assertPaymentMethodAllowed(submitted: string, policy: StorePolicy) {
	const key = paymentMethodKeyOf(submitted);
	if (key && !policy.paymentMethods.includes(key)) {
		throw new HttpError(400, "That payment method isn't available. Please choose another.", "PAYMENT_METHOD_UNAVAILABLE", { field: "paymentMethod" });
	}
}
