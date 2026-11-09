import {
  calculateDiscountPercentage,
  formatDiscountLabel,
  type DiscountBadgeVariant,
} from "@/lib/price";
import type { Product } from "@/types";

interface OfferBadgeProps {
  price?: number | null;
  oldPrice?: number | null;
  product?: Pick<Product, "price" | "oldPrice">;
  variant?: DiscountBadgeVariant;
  className?: string;
}

export default function OfferBadge({
  price: priceProp,
  oldPrice: oldPriceProp,
  product,
  variant = "save",
  className,
}: OfferBadgeProps) {
  const price = priceProp ?? product?.price;
  const oldPrice = oldPriceProp ?? product?.oldPrice;
  const percent = calculateDiscountPercentage(price, oldPrice);

  if (percent == null || percent <= 0) {
    return null;
  }

  const badgeClassName = ["rbt-offer-badge", className].filter(Boolean).join(" ");

  return (
    <span className={badgeClassName}>
      {formatDiscountLabel(percent, variant)}
    </span>
  );
}
