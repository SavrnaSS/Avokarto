export function formatCurrency(
  value: number | string | null | undefined,
  currency = "USD",
): string {
  const normalizedValue =
    typeof value === "string"
      ? Number(value.replace(/[^0-9.-]/g, ""))
      : value;

  const amount = typeof normalizedValue === "number" && Number.isFinite(normalizedValue)
    ? normalizedValue : 0;

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function calculateDiscountPercentage(
  price: number | null | undefined,
  oldPrice: number | null | undefined,
): number | null {
  if (
    typeof price !== "number" ||
    typeof oldPrice !== "number" ||
    Number.isNaN(price) ||
    Number.isNaN(oldPrice) ||
    oldPrice <= price ||
    oldPrice <= 0
  ) {
    return null;
  }

  return Math.round(((oldPrice - price) / oldPrice) * 1000) / 10;
}

function formatDiscountPercent(percent: number): string {
  return Number.isInteger(percent) ? `${percent}` : percent.toFixed(1);
}

export type DiscountBadgeVariant = "minus" | "save" | "off";

export function formatDiscountLabel(
  percent: number,
  variant: DiscountBadgeVariant = "save",
): string {
  const label = formatDiscountPercent(percent);

  switch (variant) {
    case "minus":
      return `-${label}%`;
    case "off":
      return `${label}% Off`;
    case "save":
    default:
      return `Save ${label}%`;
  }
}
