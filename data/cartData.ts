import type { CouponItem } from "@/types/misc";

export type { CouponItem } from "@/types/misc";

export const shippingCityOptions = [
  "Select your City",
  "New York",
  "London",
  "Paris",
  "Tokyo",
  "Dubai",
  "Singapore",
  "Sydney",
  "Berlin",
  "Toronto",
  "Los Angeles",
];

export const cartCoupons: CouponItem[] = [
  {
    id: "coupon-1",
    code: "WELCOME100",
    title: "UP TO 30% OFF",
    subtitle: "For orders over $9.90",
    validity: "12/18/2026 14:00 ~ 12/25/2026 14:00",
    minSpend: "$200.00",
  },
  {
    id: "coupon-2",
    code: "WELCOME100",
    title: "UP TO 30% OFF",
    subtitle: "For orders over $9.90",
    validity: "12/18/2026 14:00 ~ 12/25/2026 14:00",
    minSpend: "$200.00",
  },
];
