"use client";
import { MAX_CART_QUANTITY, normalizeCartQuantity } from "@/lib/cartQuantity";

export default function QuantitySelect({
  quantity = 1,
  setQuantity = () => {},
  parentClass = "qty-item-btn qty-item-btn-decr",
  max = MAX_CART_QUANTITY,
}: {
  quantity?: number;
  setQuantity?: (value: number) => void;
  parentClass?: string;
  max?: number;
}) {
  const safeMax = Math.max(
    1,
    Math.min(MAX_CART_QUANTITY, Math.trunc(max || 1)),
  );
  const clampQuantity = (value: unknown) =>
    Math.min(normalizeCartQuantity(value), safeMax);
  const safeQuantity = clampQuantity(quantity);

  return (
    <>
      <button
        type="button"
        className={parentClass}
        disabled={safeQuantity <= 1}
        aria-label="Decrease quantity"
        onClick={() => setQuantity(clampQuantity(safeQuantity - 1))}
      >
        <i className="fa-solid fa-minus" />
      </button>
      <input
        type="number"
        className="items-qty-input"
        value={safeQuantity}
        onChange={(e) => {
          setQuantity(clampQuantity(e.currentTarget.value));
        }}
        min={1}
        max={safeMax}
        inputMode="numeric"
        aria-label="Quantity"
      />
      <button
        type="button"
        className="qty-item-btn qty-item-btn-incr"
        disabled={safeQuantity >= safeMax}
        aria-label="Increase quantity"
        onClick={() => setQuantity(clampQuantity(safeQuantity + 1))}
      >
        <i className="fa-solid fa-plus" />
      </button>
    </>
  );
}
