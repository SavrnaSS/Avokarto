"use client";

import { createContext, useContext, useEffect, useMemo, type ReactNode } from "react";
import { useHydratedStore, useStore } from "@/context/store";
import { useLiveResource } from "@/hooks/use-live-resource";
import {
  cartAvailabilityIssues,
  cartCatalogKey,
  cartCatalogQuery,
  EMPTY_CART_CATALOG,
  readCartCatalog,
  reconcileCartCatalog,
} from "@/lib/cartCatalog";
import type { CartProduct } from "@/types";

const EMPTY_CART: CartProduct[] = [];
const CartCatalogContext = createContext({
  ready: false,
  loading: true,
  error: null as string | null,
  issues: [] as string[],
  refresh: async () => {},
});

export const useCartCatalog = () => useContext(CartCatalogContext);

export default function CartCatalogProvider({ children }: { children: ReactNode }) {
  const cart = useHydratedStore((state) => state.cartProducts, EMPTY_CART);
  const key = cartCatalogKey(cart);
  const query = cartCatalogQuery(key);
  const resource = useLiveResource({
    endpoint: cart.length ? `/api/products?${query}` : null,
    initialData: EMPTY_CART_CATALOG,
    // "resellers": a store changing its margin or being suspended reprices lines.
    topics: ["products", "resellers"],
    loader: readCartCatalog,
    retryAttempts: 1,
    deduplicate: true,
  });
  const { data, hasData, loading, refreshing, error, refresh } = resource;
  const pending = loading || refreshing;

  useEffect(() => {
    if (!hasData || pending || error || (!data.products.length && !cart.length)) return;
    const state = useStore.getState();
    // Late responses must never resurrect removed items or overwrite another cart.
    if (cartCatalogKey(state.cartProducts) !== key) return;
    const next = reconcileCartCatalog(state.cartProducts, data);
    if (next !== state.cartProducts) state.setCartProducts(next);
  }, [data, hasData, pending, error, key, cart.length]);

  useEffect(() => {
    if (!cart.length) return;
    const onReturn = () => {
      if (document.visibilityState === "visible" && navigator.onLine) void refresh();
    };
    window.addEventListener("online", onReturn);
    window.addEventListener("focus", onReturn);
    document.addEventListener("visibilitychange", onReturn);
    return () => {
      window.removeEventListener("online", onReturn);
      window.removeEventListener("focus", onReturn);
      document.removeEventListener("visibilitychange", onReturn);
    };
  }, [cart.length, refresh]);

  const reconciled = useMemo(() => hasData ? reconcileCartCatalog(cart, data) : cart, [cart, data, hasData]);
  const issues = cartAvailabilityIssues(reconciled);
  const ready = hasData && !pending && !error && reconciled === cart && issues.length === 0;

  return (
    <CartCatalogContext.Provider value={{ ready, loading: pending || !hasData, error, issues, refresh }}>
      {children}
    </CartCatalogContext.Provider>
  );
}
