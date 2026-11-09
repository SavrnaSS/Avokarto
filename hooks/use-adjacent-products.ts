"use client";

import { useLiveResource } from "./use-live-resource";
import type { Product } from "@/types/product";

type AdjacentProducts = {
  next: Product | null;
  prev: Product | null;
};

const EMPTY_ADJACENT: AdjacentProducts = { next: null, prev: null };

export function useAdjacentProducts({
  catalogId,
}: {
  catalogId?: string | null;
}) {
  const { data, ...state } = useLiveResource<AdjacentProducts>({
    endpoint: catalogId ? `/api/products/${catalogId}/adjacent` : null,
    initialData: EMPTY_ADJACENT,
    topics: ["products"],
    retryAttempts: 2,
    deduplicate: true,
  });

  return { ...state, next: data.next, prev: data.prev };
}
