import { cache } from "react";
import { hasDatabaseConfig } from "@/lib/backend/db";
import { listStorefrontCategories } from "@/lib/backend/storefront-categories";
import { listStorefrontProducts } from "@/lib/backend/storefront-data";

export const CATALOG_PAGE_SIZE = 24;
export const getCatalogCategories = cache(async () => hasDatabaseConfig() ? listStorefrontCategories() : []);
export const getCatalogCategory = cache(async (slug: string) => (await getCatalogCategories()).find((category) => category.slug === slug) ?? null);

/** Shared by metadata and the page so a missing page 404s before streaming. */
export const getCatalogWindow = cache(async (page: number, search = "", categoriesKey = "[]") => {
  if (!hasDatabaseConfig()) return undefined;
  const products = await listStorefrontProducts({
    limit: CATALOG_PAGE_SIZE + 1,
    offset: (page - 1) * CATALOG_PAGE_SIZE,
    search,
    categories: JSON.parse(categoriesKey) as string[],
  });
  return { products: products.slice(0, CATALOG_PAGE_SIZE), hasMore: products.length > CATALOG_PAGE_SIZE };
});
