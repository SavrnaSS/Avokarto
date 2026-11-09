import type { Product } from "@/types";

export const PRODUCT_NAVIGATION_START_EVENT =
  "avokarto:product-navigation-start";

const MAX_CACHED_PRODUCT_KEYS = 192;
const SESSION_CACHE_KEY = "avokarto:product-navigation-cache";
const PENDING_ROUTE_KEY = "avokarto:pending-product-route";
const SESSION_CACHE_LIMIT = 24;
const productCache = new Map<string, Product>();
const cacheListeners = new Set<() => void>();

function productKeys(product: Product) {
  return [product.slug, product.catalogId, String(product.id)].filter(
    (value): value is string => Boolean(value),
  );
}

function rememberProductsForNavigation(products: readonly Product[]) {
  try {
    window.sessionStorage.setItem(
      SESSION_CACHE_KEY,
      JSON.stringify(products.slice(0, SESSION_CACHE_LIMIT)),
    );
  } catch {
    // In-memory navigation still works when storage is unavailable or full.
  }
}

function restoreProductForRoute(routeId: string) {
  try {
    const stored = JSON.parse(
      window.sessionStorage.getItem(SESSION_CACHE_KEY) ?? "[]",
    ) as unknown;
    if (!Array.isArray(stored)) return null;

    const product = stored.find((candidate): candidate is Product => {
      if (!candidate || typeof candidate !== "object") return false;
      return productKeys(candidate as Product).includes(routeId);
    });
    if (!product) return null;

    for (const key of productKeys(product)) productCache.set(key, product);
    return product;
  } catch {
    return null;
  }
}

export function primeProductNavigationCache(products: readonly Product[]) {
  if (typeof window === "undefined" || !products.length) return;

  let changed = false;
  for (const product of products) {
    for (const key of productKeys(product)) {
      if (productCache.get(key) !== product) {
        productCache.set(key, product);
        changed = true;
      }
    }
  }

  rememberProductsForNavigation(products);

  while (productCache.size > MAX_CACHED_PRODUCT_KEYS) {
    const oldestKey = productCache.keys().next().value;
    if (typeof oldestKey !== "string") break;
    productCache.delete(oldestKey);
  }

  if (changed) cacheListeners.forEach((listener) => listener());
}

export function getPrimedProduct(routeId: string) {
  return productCache.get(routeId) ?? restoreProductForRoute(routeId);
}

export function subscribeProductNavigationCache(listener: () => void) {
  cacheListeners.add(listener);
  return () => cacheListeners.delete(listener);
}

export function setPendingProductNavigation(href: string) {
  if (typeof window === "undefined") return;

  try {
    const pathname = new URL(href, window.location.origin).pathname;
    const match = pathname.match(/^\/product\/([^/?#]+)\/?$/);
    if (!match?.[1]) {
      window.sessionStorage.removeItem(PENDING_ROUTE_KEY);
      return;
    }

    window.sessionStorage.setItem(
      PENDING_ROUTE_KEY,
      decodeURIComponent(match[1]),
    );
  } catch {
    window.sessionStorage.removeItem(PENDING_ROUTE_KEY);
  }
}

export function getPendingProductRouteId() {
  if (typeof window === "undefined") return null;

  try {
    return window.sessionStorage.getItem(PENDING_ROUTE_KEY);
  } catch {
    return null;
  }
}

export function announceProductNavigation(href: string) {
  if (typeof window === "undefined") return;

  setPendingProductNavigation(href);

  window.dispatchEvent(
    new CustomEvent(PRODUCT_NAVIGATION_START_EVENT, { detail: { href } }),
  );
}
