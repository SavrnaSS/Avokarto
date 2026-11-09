"use client";

import { useContextElement } from "@/context/Context";
import { BUNDLE_DISCOUNT_PERCENT } from "@/lib/bundleDiscount";
import { getCartPricing } from "@/lib/cartQuantity";
import { useCurrency } from "@/lib/currency";

/**
 * Cart summary rows for bundle pricing: the subtotal before discounts and,
 * when a bundle qualifies, the bundle saving. The store's totalPrice is
 * already net of this discount (same rule the server checkout applies), so
 * shipping/total rows below stay correct.
 */
export default function CartBundleSavings({ subtotalLabel }: { subtotalLabel: string }) {
  const { cartProducts, mounted } = useContextElement();
  const { formatPrice } = useCurrency();
  const pricing = getCartPricing(mounted ? cartProducts : []);

  return (
    <>
      <div className="rbt-cart-subttotal">
        <p>Subtotal ({subtotalLabel})</p>
        <p className="price">{formatPrice(pricing.subtotal)}</p>
      </div>
      {pricing.discount > 0.004 ? (
        <div className="rbt-cart-subttotal" style={{ color: "var(--color-secondary, #5f8f18)" }}>
          <p style={{ color: "inherit", fontWeight: 600 }}>
            Bundle discount ({BUNDLE_DISCOUNT_PERCENT}%)
          </p>
          <p className="price" style={{ color: "inherit" }}>
            −{formatPrice(pricing.discount)}
          </p>
        </div>
      ) : null}
    </>
  );
}
