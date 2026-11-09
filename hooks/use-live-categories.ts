"use client";

import { useLiveResource } from "./use-live-resource";
import type { StorefrontCategory } from "@/lib/storefront-categories";

export type LiveCategory = StorefrontCategory;

const EMPTY_CATEGORIES: LiveCategory[] = [];

export function useLiveCategories(initialCategories?: LiveCategory[]) {
  const { data, ...state } = useLiveResource({
    endpoint: "/api/categories",
    initialData: initialCategories ?? EMPTY_CATEGORIES,
    initialDataReady: initialCategories !== undefined,
    // Product publication, deletion and reassignment also change category counts.
    topics: ["categories", "products"],
    retryAttempts: 2,
    deduplicate: true,
  });
  return { ...state, categories: data };
}
