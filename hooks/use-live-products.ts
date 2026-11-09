"use client";

import { useEffect } from "react";
import { useLiveResource } from "./use-live-resource";
import { primeProductNavigationCache } from "@/lib/productNavigation";
import type { Product } from "@/types/product";
import { normalizeCategoryNames } from "@/lib/storefront-categories";

const EMPTY_PRODUCTS: Product[] = [];

export function useLiveProducts({
  catalogIds,
  categories,
  limit = 24,
  search,
  initialProducts,
  enabled = true,
}: {
  catalogIds?: readonly string[];
  categories?: readonly string[];
  limit?: number;
  search?: string;
  initialProducts?: Product[];
  // false defers the request (and realtime subscription) until needed,
  // e.g. for panels that are mounted but not yet opened.
  enabled?: boolean;
} = {}) {
  const query = new URLSearchParams({ limit: String(limit) });
  if (search?.trim()) query.set("q", search.trim());
  for (const category of normalizeCategoryNames(categories)) {
    query.append("category", category);
  }
  const uniqueCatalogIds = [
    ...new Set(catalogIds?.map((value) => value.trim()).filter(Boolean) ?? []),
  ];
  for (const catalogId of uniqueCatalogIds) {
    query.append("catalogId", catalogId);
  }
  const { data, ...state } = useLiveResource({
    endpoint: enabled ? `/api/products?${query}` : null,
    initialData: initialProducts ?? EMPTY_PRODUCTS,
    initialDataReady: initialProducts !== undefined,
    topics: ["products", "categories"],
    retryAttempts: 2,
    deduplicate: true,
  });

  useEffect(() => {
    primeProductNavigationCache(data);
  }, [data]);

  return { ...state, products: data };
}
