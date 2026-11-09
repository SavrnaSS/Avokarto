import { DEFAULT_STORE_POLICY, getStorePolicy, type StorePolicy } from "./storePolicy";

/*
 * Free shipping: orders whose merchandise (USD, after discounts, before
 * shipping) reaches the threshold ship free - when the admin has it switched
 * on (Admin -> Settings -> Shipping). Every function takes the policy to
 * apply; browser code can omit it to use the live one (lib/storePolicy.ts),
 * the server always passes the database's.
 */

export type FreeShippingPolicy = StorePolicy["freeShipping"];

/** The default threshold, before the admin changes it. */
export const FREE_SHIPPING_THRESHOLD_USD = DEFAULT_STORE_POLICY.freeShipping.thresholdUsd;

const live = () => getStorePolicy().freeShipping;
const cents = (usd: number) => (Number.isFinite(usd) ? Math.max(0, Math.round((usd + Number.EPSILON) * 100)) : 0);

export function qualifiesForFreeShipping(merchandiseTotalUsd: number, policy: FreeShippingPolicy = live()) {
  return policy.enabled && cents(merchandiseTotalUsd) >= cents(policy.thresholdUsd);
}

/** How much more qualifies; 0 once it does - and 0 when free shipping is off (check `enabled` before promising it). */
export function getFreeShippingRemaining(merchandiseTotalUsd: number, policy: FreeShippingPolicy = live()) {
  if (!policy.enabled) return 0;
  return Math.max(0, cents(policy.thresholdUsd) - cents(merchandiseTotalUsd)) / 100;
}

/** Apply the threshold waiver to the customer's selected, validated shipping method. */
export function getShippingCost(merchandiseTotalUsd: number, methodPriceUsd: number, policy: FreeShippingPolicy = live()) {
  return qualifiesForFreeShipping(merchandiseTotalUsd, policy) ? 0 : methodPriceUsd;
}

/** "$100" - for promo copy. Null when free shipping is off, so the copy can drop out. */
export function freeShippingThresholdLabel(policy: FreeShippingPolicy = live()) {
  if (!policy.enabled) return null;
  const amount = policy.thresholdUsd;
  return `$${Number.isInteger(amount) ? amount : amount.toFixed(2)}`;
}
