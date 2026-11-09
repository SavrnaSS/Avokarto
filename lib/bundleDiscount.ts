/**
 * Bundle pricing - the single source of truth used by the storefront (bundle
 * builder, cart, checkout summary) AND the server checkout, so the price a
 * shopper sees is exactly the price they're charged.
 *
 * Rule: products added together from the "bundle" section share a bundleId.
 * A bundle qualifies when at least BUNDLE_MIN_ITEMS different products with
 * that bundleId are purchased together; every unit of those products is then
 * priced BUNDLE_DISCOUNT_RATE lower. Remove items until fewer than
 * BUNDLE_MIN_ITEMS remain and the discount disappears on its own.
 */

export const BUNDLE_DISCOUNT_RATE = 0.1;
export const BUNDLE_DISCOUNT_PERCENT = Math.round(BUNDLE_DISCOUNT_RATE * 100);
export const BUNDLE_MIN_ITEMS = 2;

export type BundlePricingLine = {
  // Stable per-product key (e.g. product id).
  key: string;
  bundleId?: string | null;
  unitPrice: number;
  quantity: number;
};

export type BundlePricing = {
  // Sum of unitPrice x quantity before any bundle discount.
  subtotal: number;
  // Total bundle saving across all qualifying bundles.
  discount: number;
  // subtotal - discount: what the merchandise actually costs.
  total: number;
  // Discounted unit price for each line in a qualifying bundle.
  discountedUnitPrice: Map<string, number>;
  // Number of qualifying bundles.
  bundleCount: number;
};

function roundCents(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/** Discounted price of one unit - rounded per unit so client and server agree to the cent. */
export function bundleUnitPrice(unitPrice: number) {
  return roundCents(unitPrice * (1 - BUNDLE_DISCOUNT_RATE));
}

/** Which bundleIds qualify (>= BUNDLE_MIN_ITEMS distinct products present). */
export function qualifyingBundleIds(lines: readonly Pick<BundlePricingLine, "key" | "bundleId">[]) {
  const members = new Map<string, Set<string>>();
  for (const line of lines) {
    if (!line.bundleId) continue;
    const set = members.get(line.bundleId) ?? new Set<string>();
    set.add(line.key);
    members.set(line.bundleId, set);
  }
  return new Set(
    [...members.entries()]
      .filter(([, keys]) => keys.size >= BUNDLE_MIN_ITEMS)
      .map(([bundleId]) => bundleId),
  );
}

export function priceWithBundles(lines: readonly BundlePricingLine[]): BundlePricing {
  const qualifying = qualifyingBundleIds(lines);
  const discountedUnitPrice = new Map<string, number>();
  let subtotal = 0;
  let total = 0;

  for (const line of lines) {
    const quantity = Math.max(0, line.quantity);
    const unit = Math.max(0, line.unitPrice);
    subtotal += unit * quantity;
    if (line.bundleId && qualifying.has(line.bundleId)) {
      const discounted = bundleUnitPrice(unit);
      discountedUnitPrice.set(line.key, discounted);
      total += discounted * quantity;
    } else {
      total += unit * quantity;
    }
  }

  subtotal = roundCents(subtotal);
  total = roundCents(total);
  return {
    subtotal,
    discount: roundCents(subtotal - total),
    total,
    discountedUnitPrice,
    bundleCount: qualifying.size,
  };
}

/** A fresh id for a bundle added to the cart in one go. */
export function newBundleId() {
  const random =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `b-${Date.now().toString(36)}-${random}`;
}
