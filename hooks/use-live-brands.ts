"use client";

import { useLiveResource } from "./use-live-resource";

export type LiveBrand = {
  count: number;
  initials: string;
  name: string;
  slug: string;
};

const EMPTY_BRANDS: LiveBrand[] = [];

// Same pattern as use-live-categories.ts - /api/brands already filters to
// published brands server-side.
export function useLiveBrands() {
  const { data, ...state } = useLiveResource({
    endpoint: "/api/brands",
    initialData: EMPTY_BRANDS,
    topics: ["brands"],
    retryAttempts: 2,
    deduplicate: true,
  });
  return { ...state, brands: data };
}
