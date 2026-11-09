"use client";

import { useHydratedStore } from "@/context/store";

export default function WishlistLength() {
  const count = useHydratedStore((state) => state.wishList.length, 0);
  return <>{count}</>;
}
