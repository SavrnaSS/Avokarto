"use client";

import { useSyncExternalStore } from "react";
import { create } from "zustand";
import { persist, type StorageValue } from "zustand/middleware";
import { useShallow } from "zustand/react/shallow";

import type {
  Product as ProductType,
  CartProduct as CartProductType,
} from "@/types";
import {
  getCartTotalPrice,
  isProductOutOfStock,
  MAX_CART_QUANTITY,
  normalizeCartProduct,
  normalizeCartProducts,
  normalizeCartQuantity,
} from "@/lib/cartQuantity";
import { withProductDetailsPageUrl } from "@/lib/productLinks";

export type Product = ProductType;
export type CartProduct = CartProductType;
export type ProductId = number | string;

interface StoreState {
  cartProducts: CartProduct[];
  wishList: Product[];
  compareItem: Product[];
  quickViewItem: Product;
  quickAddItem: ProductId;
  totalPrice: number;
  activeCartProduct: CartProduct | null;
  // Shared by the product panel, sticky bar and quick view; never persisted.
  quantityDrafts: Record<string, number | undefined>;
  setQuantityDraft: (id: ProductId, quantity: number | undefined) => void;
  prepareCheckout: (item: Product, quantity: number) => boolean;
  setCartProducts: (
    value: CartProduct[] | ((prev: CartProduct[]) => CartProduct[]),
  ) => void;
  setWishList: (value: Product[] | ((prev: Product[]) => Product[])) => void;
  setQuickViewItem: (item: Product) => void;
  setQuickAddItem: (id: ProductId) => void;
  setCompareItem: (value: Product[] | ((prev: Product[]) => Product[])) => void;
  setActiveCartProduct: (item: CartProduct | null) => void;
  isAddedToCartProducts: (id: ProductId) => boolean;
  addProductToCart: (item: Product, qty?: number) => void;
  // Adds a bundle in one go: new items are added and items already in the
  // cart join the bundle, so the whole set gets the bundle discount.
  addBundleToCart: (items: Product[], bundleId: string) => void;
  updateQuantity: (id: ProductId, qty: number) => void;
  quantityInCart: (id: ProductId) => number;
  addToWishlist: (item: Product) => void;
  removeFromWishlist: (id: ProductId) => void;
  addToCompareItem: (item: Product) => void;
  removeFromCompareItem: (id: ProductId) => void;
  isAddedtoWishlist: (id: ProductId) => boolean;
  isAddedToCompareItem: (id: ProductId) => boolean;
}

/** Initial quick-view slot before any product is chosen (avoids importing demo catalog into the store module). */
const EMPTY_QUICK_VIEW_PRODUCT: Product = {
  id: 0,
  title: "",
  price: 0,
  imgSrc: "",
};

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      cartProducts: [],
      wishList: [],
      compareItem: [],
      quickViewItem: EMPTY_QUICK_VIEW_PRODUCT,
      quickAddItem: 0,
      totalPrice: 0,
      activeCartProduct: null,
      quantityDrafts: {},
      setQuantityDraft: (id, quantity) =>
        set((state) => ({
          quantityDrafts: { ...state.quantityDrafts, [String(id)]: quantity },
        })),

      prepareCheckout: (item, quantity) => {
        const price = Number(item.price);
        if (!item.id || !Number.isFinite(price) || price < 0 || isProductOutOfStock(item)) {
          return false;
        }

        const stockLimit = Number.isFinite(item.availableQuantity)
          ? Math.max(0, Math.trunc(item.availableQuantity!))
          : MAX_CART_QUANTITY;
        if (stockLimit < 1) return false;

        const cartItem = normalizeCartProduct(
          withProductDetailsPageUrl(item),
          Math.min(normalizeCartQuantity(quantity), stockLimit),
        );
        // Commit the item and total together before navigating. Repeated clicks
        // replace the selected quantity instead of adding it again. Refresh
        // cached price/stock while preserving any existing bundle membership.
        set((state) => {
          const existing = state.cartProducts.find((line) => String(line.id) === String(item.id));
          const cartProducts = existing
            ? state.cartProducts.map((line) =>
                String(line.id) === String(item.id) ? { ...line, ...cartItem } : line,
              )
            : [...state.cartProducts, cartItem];
          return {
            cartProducts,
            totalPrice: getCartTotalPrice(cartProducts),
            quantityDrafts: { ...state.quantityDrafts, [String(item.id)]: undefined },
          };
        });
        return true;
      },

      setCartProducts: (value) =>
        set((state) => {
          const next =
            typeof value === "function" ? value(state.cartProducts) : value;
          const cartProducts = normalizeCartProducts(next);
          return {
            cartProducts,
            totalPrice: getCartTotalPrice(cartProducts),
          };
        }),

      setWishList: (value) =>
        set((state) => ({
          wishList: typeof value === "function" ? value(state.wishList) : value,
        })),

      setQuickViewItem: (item) => set({ quickViewItem: item }),
      setQuickAddItem: (id) => set({ quickAddItem: id }),
      setCompareItem: (value) =>
        set((state) => ({
          compareItem:
            typeof value === "function" ? value(state.compareItem) : value,
        })),
      setActiveCartProduct: (item) => set({ activeCartProduct: item }),

      isAddedToCartProducts: (id) => {
        const cart = get().cartProducts;
        return cart.some((elm) => String(elm.id) === String(id));
      },

      addProductToCart: (item, qty = 1) => {
        const { cartProducts, isAddedToCartProducts } = get();
        if (isAddedToCartProducts(item.id)) return;
        const cartItem = normalizeCartProduct(withProductDetailsPageUrl(item), qty);
        const next = [...cartProducts, cartItem];
        set({ cartProducts: next, totalPrice: getCartTotalPrice(next) });
      },

      addBundleToCart: (items, bundleId) => {
        const next = [...get().cartProducts];
        for (const item of items) {
          const index = next.findIndex((line) => String(line.id) === String(item.id));
          if (index >= 0) {
            next[index] = { ...next[index], bundleId };
          } else {
            next.push({
              ...normalizeCartProduct(withProductDetailsPageUrl(item), 1),
              bundleId,
            });
          }
        }
        set({ cartProducts: next, totalPrice: getCartTotalPrice(next) });
      },

      updateQuantity: (id, qty) => {
        const { cartProducts, isAddedToCartProducts } = get();
        if (!isAddedToCartProducts(id)) return;
        const nextQuantity = normalizeCartQuantity(qty);
        const items = cartProducts.map((item) =>
          String(item.id) === String(id)
            ? { ...item, quantity: nextQuantity }
            : item,
        );
        set({ cartProducts: items, totalPrice: getCartTotalPrice(items) });
      },

      quantityInCart: (id) => {
        const item = get().cartProducts.find(
          (elm) => String(elm.id) === String(id),
        );
        return item ? item.quantity : 0;
      },

      addToWishlist: (item) => {
        const { wishList } = get();
        const isAlreadyAdded = wishList.some((elm) => elm.id == item.id);
        if (isAlreadyAdded) {
          set({ wishList: wishList.filter((elm) => elm.id != item.id) });
          return;
        }
        set({ wishList: [...wishList, item] });
      },

      removeFromWishlist: (id) => {
        set((state) => ({
          wishList: state.wishList.filter((elm) => elm.id != id),
        }));
      },

      addToCompareItem: (item) => {
        const { compareItem } = get();
        if (compareItem.some((elm) => elm.id == item.id)) return;
        set({ compareItem: [...compareItem, item] });
      },

      removeFromCompareItem: (id) => {
        set((state) => ({
          compareItem: state.compareItem.filter((elm) => elm.id != id),
        }));
      },

      isAddedtoWishlist: (id) => get().wishList.some((elm) => elm.id == id),
      isAddedToCompareItem: (id) =>
        get().compareItem.some((elm) => elm.id == id),
    }),
    {
      name: "avokarto-store",
      partialize: (state) => ({
        cartProducts: state.cartProducts,
        wishList: state.wishList,
        compareItem: state.compareItem,
        // Kept for persist typing / older saved blobs; always reconciled in `getItem`.
        totalPrice: state.totalPrice,
      }),
      storage: {
        getItem: (
          name,
        ): StorageValue<{
          cartProducts: CartProduct[];
          wishList: Product[];
          compareItem: Product[];
          totalPrice: number;
        }> | null => {
          if (typeof window === "undefined") return null;
          try {
            const str = window.localStorage.getItem(name);
            if (str) {
              type PersistedSlice = {
                cartProducts: CartProduct[];
                wishList: Product[];
                compareItem: Product[];
                totalPrice: number;
              };
              const parsed = JSON.parse(str) as StorageValue<
                Partial<PersistedSlice> & { state?: Partial<PersistedSlice> }
              >;
              if (!parsed?.state || typeof parsed.state !== "object") {
                return null;
              }
              const cart = Array.isArray(parsed.state.cartProducts)
                ? normalizeCartProducts(parsed.state.cartProducts)
                : [];
              parsed.state.cartProducts = cart;
              parsed.state.wishList = normalizeStoredProductList(
                parsed.state.wishList,
              );
              parsed.state.compareItem = normalizeStoredProductList(
                parsed.state.compareItem,
              );
              parsed.state.totalPrice = getCartTotalPrice(cart);
              return parsed as StorageValue<PersistedSlice>;
            }
          } catch {
            // Storage can be unavailable in private/restricted browsing.
            return null;
          }

          return null;
        },
        setItem: (
          name,
          value: StorageValue<{
            cartProducts: CartProduct[];
            wishList: Product[];
            compareItem: Product[];
            totalPrice: number;
          }>,
        ) => {
          if (typeof window !== "undefined") {
            try {
              window.localStorage.setItem(name, JSON.stringify(value));
            } catch {
              // Keep the current-tab cart usable if storage is blocked or full.
            }
          }
        },
        removeItem: (name) => {
          if (typeof window !== "undefined") {
            try {
              window.localStorage.removeItem(name);
            } catch {
              // Clearing in-memory state must still work without storage.
            }
          }
        },
      },
    },
  ),
);

function normalizeStoredProductList(value: unknown): Product[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) =>
      typeof item === "object" && item !== null && "id" in item
        ? (item as Product)
        : undefined,
    )
    .filter((item): item is Product => Boolean(item));
}

function getContextSnapshot(state: StoreState) {
  return state;
}

function subscribeToStoreHydration(onStoreChange: () => void) {
  const unsubscribeHydrate = useStore.persist.onHydrate(onStoreChange);
  const unsubscribeFinish = useStore.persist.onFinishHydration(onStoreChange);

  return () => {
    unsubscribeHydrate();
    unsubscribeFinish();
  };
}

function getStoreHydrationSnapshot() {
  return useStore.persist.hasHydrated();
}

function getServerStoreHydrationSnapshot() {
  return false;
}

function useStoreHydrated() {
  return useSyncExternalStore(
    subscribeToStoreHydration,
    getStoreHydrationSnapshot,
    getServerStoreHydrationSnapshot,
  );
}

/** Subscribe only to the displayed value while keeping persisted data hydration-safe. */
export function useHydratedStore<T>(selector: (state: StoreState) => T, initialValue: T) {
  const value = useStore(selector);
  const hydrated = useStoreHydrated();
  return hydrated ? value : initialValue;
}

/**
 * Same API as the old useContextElement() for drop-in replacement in existing components.
 * `useShallow` compares selected fields so we re-render when cart/wishlist/etc. change,
 * without treating every store tick as a new object identity (plain selector would).
 */
export function useContextElement() {
  const store = useStore(useShallow(getContextSnapshot));
  const mounted = useStoreHydrated();

  return {
    ...store,
    mounted,
    // Provide wrapped hydration-safe checks
    isAddedToCartProducts: (id: ProductId) =>
      mounted ? store.isAddedToCartProducts(id) : false,
    isAddedtoWishlist: (id: ProductId) =>
      mounted ? store.isAddedtoWishlist(id) : false,
    isAddedToCompareItem: (id: ProductId) =>
      mounted ? store.isAddedToCompareItem(id) : false,
    quantityInCart: (id: ProductId) => (mounted ? store.quantityInCart(id) : 0),
  };
}
