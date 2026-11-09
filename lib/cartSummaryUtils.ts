import {
  type FreeShippingPolicy,
  FREE_SHIPPING_THRESHOLD_USD,
  getFreeShippingRemaining,
  getShippingCost,
  qualifiesForFreeShipping,
} from "./shippingPolicy";
import { getStorePolicy } from "./storePolicy";

export const FREE_SHIPPING_THRESHOLD = FREE_SHIPPING_THRESHOLD_USD;

export function getCartSummary(
  totalPrice: number,
  itemCount: number,
  shippingOverride?: number,
  policy: FreeShippingPolicy = getStorePolicy().freeShipping,
) {
  const clampedTotal = Number.isFinite(totalPrice)
    ? Math.max(0, Math.round((totalPrice + Number.EPSILON) * 100) / 100)
    : 0;
  const hasItems = itemCount > 0;
  const hasFreeShipping = hasItems && qualifiesForFreeShipping(clampedTotal, policy);
  const hasShippingRate = shippingOverride !== undefined && Number.isFinite(shippingOverride);
  const shippingPending = hasItems && !hasFreeShipping && !hasShippingRate;
  // Until a delivery method is selected, show the merchandise total rather
  // than inventing a delivery charge. A selected rate never bypasses the waiver.
  const shippingTotal = hasItems
    ? getShippingCost(clampedTotal, hasShippingRate ? Math.max(0, shippingOverride!) : 0, policy)
    : 0;
  const orderTotal = Math.round((clampedTotal + shippingTotal + Number.EPSILON) * 100) / 100;
  const amountToFreeShipping = getFreeShippingRemaining(hasItems ? clampedTotal : 0, policy);
  const threshold = policy.thresholdUsd;
  const progressPercent = !policy.enabled
    ? 0
    : threshold > 0
      ? Math.min(((threshold - amountToFreeShipping) / threshold) * 100, 100)
      : 100;
  const subtotalLabel = itemCount === 1 ? "1 item" : `${itemCount} items`;

  return {
    hasItems,
    subtotalLabel,
    shippingTotal,
    shippingPending,
    orderTotal,
    amountToFreeShipping,
    progressPercent,
    hasFreeShipping,
    // Off in Admin -> Settings -> Shipping: hide free-shipping progress and promises.
    freeShippingOffered: policy.enabled,
  };
}
