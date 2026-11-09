"use client";

/**
 * The order the shopper just placed, kept in *their own browser* for the
 * thank-you page. Order numbers appear in the thank-you URL, so looking the
 * order up on the server by number alone would let anyone holding the link
 * see the customer's name and address; this record never leaves the
 * buyer's device. sessionStorage: survives a refresh, cleared when the tab
 * closes (kinder on shared devices).
 */

const STORAGE_KEY = "avokarto:last-order";

export type LastOrderItem = {
  title: string;
  imgSrc?: string;
  href?: string;
  quantity: number;
  // Unit price actually charged (after any bundle discount).
  unitPrice: number;
  // Regular unit price, when a bundle discount applied.
  regularUnitPrice?: number;
};

export type LastOrder = {
  orderNumber: string;
  placedAt: string;
  customerName: string;
  email: string;
  phone?: string;
  addressLines: string[];
  shippingMethod?: { name: string; estimate?: string };
  paymentMethod: string;
  items: LastOrderItem[];
  // Totals as returned by the server checkout (authoritative).
  subtotal: number;
  bundleDiscount: number;
  shippingCost: number;
  total: number;
};

export function saveLastOrder(order: LastOrder) {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(order));
  } catch {
    // Storage unavailable (private mode / quota): the thank-you page falls
    // back to a generic confirmation.
  }
}

/** The saved order, only if it matches the order number being shown. */
export function readLastOrder(orderNumber: string): LastOrder | null {
  if (!orderNumber) return null;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const order = JSON.parse(raw) as LastOrder;
    return order?.orderNumber === orderNumber ? order : null;
  } catch {
    return null;
  }
}
