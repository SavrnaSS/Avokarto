"use client";

import { useMemo } from "react";
import { useLiveResource } from "./use-live-resource";
import type { Product } from "@/types/product";

const EMPTY_PRODUCTS: Product[] = [];

export function useRecommendedProducts({
  currentProduct,
  limit = 6,
}: {
  currentProduct?: Pick<Product, "catalogId" | "id" | "category"> | null;
  limit?: number;
}) {
  const { data, ...state } = useLiveResource({
    endpoint: currentProduct ? "/api/products?limit=24" : null,
    initialData: EMPTY_PRODUCTS,
    topics: ["products"],
    retryAttempts: 2,
    deduplicate: true,
  });
  const excludeKey = currentProduct?.catalogId ?? String(currentProduct?.id);
  const category = currentProduct?.category?.[0];
  const products = useMemo(() => {
    const others = data.filter((product) => (product.catalogId ?? String(product.id)) !== excludeKey);
    if (category) others.sort((a, b) =>
      Number(!a.category?.includes(category)) - Number(!b.category?.includes(category)));
    return others.slice(0, limit);
  }, [data, excludeKey, category, limit]);
  return { ...state, products };
}
