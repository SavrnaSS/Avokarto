// Shared by the seller dashboard (live "you earn" preview), the public
// store pages and checkout, so every surface agrees on a reseller's price.

export type MarginType = "fixed" | "percent";

export type ResellerPrice = {
	/** Reseller's margin per unit (before the platform fee). */
	margin: number;
	/** What the reseller receives per unit after the platform fee. */
	net: number;
	/** Platform fee per unit. */
	platformFee: number;
	/** What the customer pays per unit. */
	salePrice: number;
};

function cents(value: number) {
	return Math.round((value + Number.EPSILON) * 100) / 100;
}

/** The most margin allowed on a product, in currency. */
export function maxMargin(basePrice: number, maxMarginPercent: number) {
	return cents(Math.max(0, basePrice) * (Math.max(0, maxMarginPercent) / 100));
}

/**
 * A reseller's price for one unit. The margin is capped at the
 * marketplace's maximum, so a listing saved under an older, higher cap
 * can never charge more than today's rules allow.
 */
export function resellerPrice(
	basePrice: number,
	marginType: MarginType,
	marginValue: number,
	{ maxMarginPercent, platformFeePercent }: { maxMarginPercent: number; platformFeePercent: number },
): ResellerPrice {
	const base = cents(Math.max(0, basePrice));
	const requested = marginType === "percent"
		? base * (Math.max(0, marginValue) / 100)
		: Math.max(0, marginValue);
	const margin = cents(Math.min(requested, maxMargin(base, maxMarginPercent)));
	const platformFee = cents(margin * (Math.min(100, Math.max(0, platformFeePercent)) / 100));

	return {
		margin,
		net: cents(margin - platformFee),
		platformFee,
		salePrice: cents(base + margin),
	};
}

/** Problems with a margin a reseller entered, or null when it's acceptable. */
export function marginProblem(
	basePrice: number,
	marginType: MarginType,
	marginValue: number,
	maxMarginPercent: number,
) {
	if (!Number.isFinite(marginValue) || marginValue < 0) return "Enter a margin of 0 or more.";
	const limit = maxMargin(basePrice, maxMarginPercent);
	const requested = marginType === "percent" ? basePrice * (marginValue / 100) : marginValue;
	if (cents(requested) > limit) {
		return marginType === "percent"
			? `The most you can add is ${maxMarginPercent}%.`
			: `The most you can add on this product is ${limit.toFixed(2)}.`;
	}
	return null;
}

export const STORE_HANDLE_PATTERN = /^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])$/;

// Handles that would impersonate the marketplace or confuse shoppers.
const RESERVED_HANDLES = new Set([
	"admin", "administrator", "api", "avokarto", "help", "login", "official",
	"root", "seller", "sellers", "sell", "shop", "staff", "store", "stores",
	"support", "system",
]);

/** Turn a store name into a candidate handle. */
export function suggestHandle(name: string) {
	return name
		.toLowerCase()
		.normalize("NFKD")
		.replace(/[̀-ͯ]/g, "")
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "")
		.slice(0, 40)
		.replace(/-+$/g, "");
}

export function handleProblem(handle: string) {
	if (!STORE_HANDLE_PATTERN.test(handle)) {
		return "Use 3-40 lowercase letters, numbers or dashes, starting and ending with a letter or number.";
	}
	if (handle.includes("--")) return "Use single dashes only.";
	if (RESERVED_HANDLES.has(handle) || handle.startsWith("avokarto")) {
		return "That store link is reserved. Try another.";
	}
	return null;
}
