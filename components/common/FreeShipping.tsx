"use client";

import type { ReactNode } from "react";
import { useStorePolicy } from "@/hooks/useStorePolicy";
import { freeShippingThresholdLabel } from "@/lib/shippingPolicy";

/* For server-rendered copy that mentions free shipping: the live minimum
   from Admin -> Settings -> Shipping, and a gate that hides the promise
   (or shows `fallback`) when free shipping is switched off. */

/** "$100" - the live free-shipping minimum. */
export function FreeShippingAmount() {
  return <>{freeShippingThresholdLabel(useStorePolicy().freeShipping) ?? ""}</>;
}

export function IfFreeShipping({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  return <>{useStorePolicy().freeShipping.enabled ? children : fallback}</>;
}
