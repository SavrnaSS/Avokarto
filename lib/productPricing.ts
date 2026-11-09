// Shared by the admin product form (live price preview) and the server
// (validation), so both agree on what a discount produces.

export type DiscountType = "fixed" | "none" | "percentage";

export const MAX_DISCOUNT_PERCENT = 95;

export function roundMoney(value: number) {
	return Math.round(value * 100) / 100;
}

export type PricingResult =
	| { error: null; oldPrice: number | null; price: number }
	| { error: string; oldPrice: null; price: null };

/**
 * Turn the form's regular price + discount into what is stored:
 * `price` (what customers pay) and `oldPrice` (the struck-through price,
 * null when there is no discount).
 */
export function computePricing(
	regularPrice: number,
	discountType: DiscountType,
	discountValue: number,
): PricingResult {
	if (!Number.isFinite(regularPrice) || regularPrice < 0) {
		return { error: "Enter a price of 0 or more.", oldPrice: null, price: null };
	}

	const regular = roundMoney(regularPrice);

	if (discountType === "none") {
		return { error: null, oldPrice: null, price: regular };
	}

	if (!Number.isFinite(discountValue) || discountValue <= 0) {
		return { error: "Enter a discount greater than 0, or choose No Discount.", oldPrice: null, price: null };
	}

	if (discountType === "percentage") {
		if (discountValue > MAX_DISCOUNT_PERCENT) {
			return { error: `A percentage discount can be at most ${MAX_DISCOUNT_PERCENT}%.`, oldPrice: null, price: null };
		}

		const price = roundMoney(regular * (1 - discountValue / 100));
		return price < regular
			? { error: null, oldPrice: regular, price }
			: { error: "That discount is too small to change the price.", oldPrice: null, price: null };
	}

	if (discountValue >= regular) {
		return { error: "A fixed discount must be less than the regular price.", oldPrice: null, price: null };
	}

	return { error: null, oldPrice: regular, price: roundMoney(regular - discountValue) };
}

/** Recover the form's discount fields from a stored price/oldPrice pair. */
export function inferDiscount(price: number, oldPrice: number | null): {
	discountType: DiscountType;
	discountValue: number;
	regularPrice: number;
} {
	if (!oldPrice || oldPrice <= price) {
		return { discountType: "none", discountValue: 0, regularPrice: price };
	}

	// The stored price was rounded to cents, so the exact ratio drifts off
	// the whole percentage that produced it (15% of 19.99 → 15.0075%).
	const percent = Math.round((1 - price / oldPrice) * 100);
	const asPercentage = computePricing(oldPrice, "percentage", percent);

	if (asPercentage.error === null && asPercentage.price === price) {
		return { discountType: "percentage", discountValue: percent, regularPrice: oldPrice };
	}

	return { discountType: "fixed", discountValue: roundMoney(oldPrice - price), regularPrice: oldPrice };
}
