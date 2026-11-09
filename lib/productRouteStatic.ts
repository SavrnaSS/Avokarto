import type { Product } from "@/types";

export function buildProductStaticParams(
  products: readonly Product[],
  fallbackIds: readonly Product["id"][] = [],
) {
  const ids = new Set<string>();

  for (const product of products) {
    ids.add(String(product.id));
  }

  for (const id of fallbackIds) {
    ids.add(String(id));
  }

  return Array.from(ids, (id) => ({ id }));
}

export function createProductLookup(products: readonly Product[]) {
  return new Map(products.map((product) => [String(product.id), product]));
}

export function getProductByRouteId(
  productsById: ReadonlyMap<string, Product>,
  id: string,
) {
  return productsById.get(id);
}
