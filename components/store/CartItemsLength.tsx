"use client";
import { useHydratedStore } from "@/context/store";

export default function CartItemsLength() {
  const count = useHydratedStore((state) => state.cartProducts.length, 0);
  return <>{count}</>;
}
