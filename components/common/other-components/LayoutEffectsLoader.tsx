"use client";
// import dynamic from "next/dynamic";
import { useEffect } from "react";
import { useCustomerSession } from "@/hooks/use-customer-session";

// Loaded in its own JS chunk, never SSR'd — prevents hydration mismatches
// and keeps this code out of the critical path.
// const LayoutClientEffects = dynamic(
//   () => import("@/components/common/LayoutClientEffects"),
//   { ssr: false },
// );

export default function LayoutEffectsLoader() {
  const refresh = useCustomerSession((s) => s.refresh);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return null;
  // return <LayoutClientEffects />;
}
