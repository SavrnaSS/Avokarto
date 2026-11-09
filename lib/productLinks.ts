import type { Product } from "@/types";

// /product is the universal product details page - it replaced the old
// /product-single-default route.
export const DEFAULT_PRODUCT_DETAILS_PAGE = "/product";

// Every product has one details page. The template's per-category variants
// (/product-single-electronics, ...) are retired; stored detailsPageUrl
// values or old links pointing at them resolve here, and next.config.ts
// redirects the old URLs permanently.
export function normalizeProductDetailsPageUrl(
  _detailsPageUrl?: string | null,
  fallback = DEFAULT_PRODUCT_DETAILS_PAGE,
) {
  return fallback.replace(/\/+$/, "") || DEFAULT_PRODUCT_DETAILS_PAGE;
}

export function getProductDetailsPageUrlFromPath(pathname?: string | null) {
  if (!pathname) return undefined;
  return /^\/product(?:-single-[a-z0-9-]+)?(?:\/|$)/.test(pathname) ? DEFAULT_PRODUCT_DETAILS_PAGE : undefined;
}

export function getProductDetailsPageUrl(
  _product?: Product | null,
  fallback = DEFAULT_PRODUCT_DETAILS_PAGE,
) {
  return normalizeProductDetailsPageUrl(undefined, fallback);
}

export function getProductDetailsHref(
  product?: Product | null,
  fallback = DEFAULT_PRODUCT_DETAILS_PAGE,
) {
  if (!product?.id) return "/shop";

  // Cart lines bought through a reseller store link back to that store's
  // page, which shows the price the shopper is actually paying.
  const store = (product as { resellerStore?: { handle: string } }).resellerStore;
  if (store?.handle && product.slug) {
    return `/store/${encodeURIComponent(store.handle)}/${encodeURIComponent(product.slug)}`;
  }

  return `${getProductDetailsPageUrl(product, fallback)}/${product.slug ?? product.id}`;
}

export function withProductDetailsPageUrl<T extends Product>(
  product: T,
  detailsPageUrl?: string,
) {
  return {
    ...product,
    detailsPageUrl: normalizeProductDetailsPageUrl(
      detailsPageUrl ?? product.detailsPageUrl ?? getProductDetailsPageUrl(product),
    ),
  };
}
