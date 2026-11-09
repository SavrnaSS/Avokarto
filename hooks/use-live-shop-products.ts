"use client";

import { useEffect, useState } from "react";
import { useLiveResource } from "./use-live-resource";
import { createProductWindowReader, PRODUCT_PAGE_SIZE, type ProductWindow } from "@/lib/product-pages";
import { primeProductNavigationCache } from "@/lib/productNavigation";
import { normalizeCategoryNames } from "@/lib/storefront-categories";
import type { Product } from "@/types/product";

const EMPTY_WINDOW: ProductWindow = { products: [], hasMore: false, pageCount: 0 };

export function useLiveShopProducts({
  pageCount, categories, search, initialProducts,
}: {
  pageCount: number;
  categories: readonly string[];
  search?: string;
  initialProducts?: Product[];
}) {
  const [loader] = useState(() => createProductWindowReader());
  const query = new URLSearchParams();
  if (search?.trim()) query.set("q", search.trim());
  for (const category of normalizeCategoryNames(categories)) query.append("category", category);
  const dataKey = `/api/products?${query}`;
  query.set("pages", String(pageCount));
  const { data, ...state } = useLiveResource({
    endpoint: `/api/products?${query}`,
    dataKey,
    loader,
    initialData: initialProducts === undefined ? EMPTY_WINDOW : {
      products: initialProducts,
      hasMore: initialProducts.length >= PRODUCT_PAGE_SIZE,
      pageCount: 1,
    },
    initialDataReady: initialProducts !== undefined,
    topics: ["products", "categories", "brands"],
    retryAttempts: 2,
    deduplicate: true,
  });

  useEffect(() => {
    primeProductNavigationCache(data.products);
  }, [data.products]);

  return { ...state, products: data.products, hasMore: data.hasMore };
}
