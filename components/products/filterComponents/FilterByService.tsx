"use client";

import { useMemo } from "react";
import { Product } from "@/types";

export default function FilterByService({
  selectedItems,
  onChange,
  sourceProducts = [],
}: {
  selectedItems: string[];
  onChange: (value: string) => void;
  sourceProducts?: Product[];
}) {
  // Services are admin free text (Products > edit > Shipping Message), not
  // a fixed lookup table - the real list is whatever's actually attached to
  // a product in the catalog, derived here instead of a hardcoded set of
  // labels ("Free Delivery", "Installment", ...) that may not match any
  // real product at all.
  const services = useMemo(() => {
    const seen = new Set<string>();
    for (const product of sourceProducts) {
      for (const service of product.services ?? []) {
        const trimmed = service.trim();
        if (trimmed) seen.add(trimmed);
      }
    }
    return [...seen].sort((a, b) => a.localeCompare(b));
  }, [sourceProducts]);

  const toggleService = (label: string) => {
    onChange(label);
  };

  if (!services.length) {
    return null;
  }

  return (
    <>
      {services.map((service) => {
        const isActive = selectedItems.includes(service);
        return (
          <button
            type="button"
            key={service}
            onClick={() => {
              toggleService(service);
            }}
            className={isActive ? "active" : ""}
          >
            {service}
          </button>
        );
      })}
    </>
  );
}
