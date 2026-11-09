"use client";
import { useHydratedStore } from "@/context/store";
import { useCurrency } from "@/lib/currency";

export default function CartItemsTotal() {
  const totalPrice = useHydratedStore((state) => state.totalPrice, 0);
  const { formatPrice } = useCurrency();
  return <>{formatPrice(totalPrice)}</>;
}
