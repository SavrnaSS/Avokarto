"use client";

import { useHydratedStore } from "@/context/store";

export default function CompareItemLength() {
  const count = useHydratedStore((state) => state.compareItem.length, 0);
  return <>{count}</>;
}
