"use client";

import { Check, Truck } from "lucide-react";
import { useHydratedStore } from "@/context/store";
import { getCartItemCount } from "@/lib/cartQuantity";
import { getCartSummary } from "@/lib/cartSummaryUtils";
import { formatCurrency } from "@/lib/price";
import { useStorePolicy } from "@/hooks/useStorePolicy";
import styles from "./FreeShippingProgress.module.css";

type Props = {
  subtotal: number;
  itemCount: number;
  compact?: boolean;
  className?: string;
};

/** One presentation of the same after-discount USD policy used by checkout. */
export default function FreeShippingProgress({
  subtotal,
  itemCount,
  compact = false,
  className = "",
}: Props) {
  // Admin -> Settings -> Shipping: the live minimum, and no bar at all when it's off.
  const { freeShipping } = useStorePolicy();
  const { hasItems, hasFreeShipping, amountToFreeShipping, progressPercent } =
    getCartSummary(subtotal, itemCount, undefined, freeShipping);
  const threshold = formatCurrency(freeShipping.thresholdUsd, "USD");
  const remaining = formatCurrency(amountToFreeShipping, "USD");
  const spent = formatCurrency(hasItems ? Math.max(0, subtotal) : 0, "USD");
  const percent = Math.floor(progressPercent);
  const message = hasFreeShipping
    ? "Your order qualifies. Delivery is on us!"
    : hasItems
      ? `Add ${remaining} more to unlock free shipping.`
      : `Spend ${threshold} or more and delivery is on us.`;

  if (!freeShipping.enabled) return null;

  return (
    <section
      className={`${styles.root} ${compact ? styles.compact : ""} ${hasFreeShipping ? styles.unlocked : ""} ${progressPercent <= 0 ? styles.empty : ""} ${className}`}
      aria-label="Free shipping offer"
      data-free-shipping-status={hasFreeShipping ? "unlocked" : "pending"}
    >
      <div className={styles.content}>
        <span className={styles.icon} aria-hidden="true">
          {hasFreeShipping ? <Check size={20} /> : <Truck size={20} />}
        </span>
        <div className={styles.status} role="status" aria-live="polite" aria-atomic="true">
          <strong className={styles.title}>
            {hasFreeShipping ? "Free shipping unlocked" : "A little more, delivered free"}
          </strong>
          <p className={styles.message}>{message}</p>
        </div>
        <div className={styles.meter}>
          {/* Visual summary of the progressbar below, which carries the
              same numbers for assistive tech. */}
          <div className={styles.meterHead} aria-hidden="true">
            <span>
              <span className={styles.amount}>{spent}</span>
              <span className={styles.of}> of {threshold}</span>
            </span>
            <span className={styles.percent}>{hasFreeShipping ? "Unlocked" : `${percent}%`}</span>
          </div>
          <div
            className={styles.track}
            role="progressbar"
            aria-label="Progress toward free shipping"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={percent}
            aria-valuetext={hasFreeShipping ? "Free shipping unlocked" : `${remaining} USD to free shipping`}
          >
            <span className={styles.fill} style={{ width: `${progressPercent}%` }} />
          </div>
          <p className={styles.note}>
            <span>USD, after discounts</span>
            <span className={styles.auto}>
              <Check size={12} strokeWidth={3} aria-hidden="true" />
              Applied automatically
            </span>
          </p>
        </div>
      </div>
    </section>
  );
}

/** Product-page variant subscribes only to the two values it displays. */
export function LiveFreeShippingProgress({ className }: { className?: string }) {
  const subtotal = useHydratedStore((state) => state.totalPrice, 0);
  const itemCount = useHydratedStore((state) => getCartItemCount(state.cartProducts), 0);
  return <FreeShippingProgress subtotal={subtotal} itemCount={itemCount} className={className} />;
}
