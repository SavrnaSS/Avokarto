"use client";

import { usePathname, useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useMemo } from "react";
import { useHydratedStore, useStore } from "@/context/store";
import { cartAvailabilityIssues } from "@/lib/cartCatalog";
import { getCartPricing, MAX_CART_QUANTITY } from "@/lib/cartQuantity";
import type { PublicStore } from "@/lib/backend/resellers";
import type { CartProduct } from "@/types";

/**
 * The store a page belongs to, where its pages live, and its cart drawer.
 * Provided by StoreShell, so anything inside a store (product cards, the
 * cart, checkout) can link and act within that store - on Avokarto
 * (/store/<handle>/…) or on the seller's own domain (/…) alike.
 */
export type StoreSite = {
	/** "" on the store's own domain, "/store/<handle>" on Avokarto. */
	basePath: string;
	closeCart: () => void;
	/** A path inside the store: href("/checkout") → "/store/x/checkout" or "/checkout". */
	href: (path?: string) => string;
	openCart: () => void;
	store: PublicStore;
};

export const StoreSiteContext = createContext<StoreSite | null>(null);

export function useStoreSite() {
	return useContext(StoreSiteContext);
}

export function storeHref(basePath: string, path = "") {
	return `${basePath}${path}` || "/";
}

/** Ask the store home to filter in place (it listens for this) instead of reloading. */
export const STORE_FILTER_EVENT = "avk:store-filter";
export type StoreFilterDetail = { category?: string; q?: string };

/**
 * Show the store's catalog filtered by search and/or category: in place on
 * the store home (no reload, URL kept in sync there), otherwise by opening
 * the home page already filtered. Used by the header, menu and footer.
 */
export function useGoShop(basePath: string) {
	const router = useRouter();
	const pathname = usePathname();
	const home = basePath || "/";
	const onHome = pathname === home || pathname === `${basePath}/`;
	return useCallback(
		(detail: StoreFilterDetail) => {
			if (onHome) {
				window.dispatchEvent(new CustomEvent<StoreFilterDetail>(STORE_FILTER_EVENT, { detail }));
				document.getElementById("shop")?.scrollIntoView({ behavior: "smooth", block: "start" });
				return;
			}
			const params = new URLSearchParams();
			if (detail.q) params.set("q", detail.q);
			if (detail.category) params.set("category", detail.category);
			router.push(`${home}${params.size ? `?${params}` : ""}#shop`);
		},
		[home, onHome, router],
	);
}

const EMPTY: CartProduct[] = [];

/**
 * This store's share of the cart. On Avokarto the browser cart can also
 * hold main-shop items or another store's; the store's cart and checkout
 * only ever show and order its own, leaving the rest in the cart for later.
 * Orders still go through the same /api/checkout as everything else.
 */
export function useStoreCartLines(handle: string) {
	const cart = useHydratedStore((state) => state.cartProducts, EMPTY);
	const hydrated = useHydratedStore(() => true, false);
	const setCartProducts = useStore((state) => state.setCartProducts);

	const lines = useMemo(() => cart.filter((line) => line.resellerStore?.handle === handle), [cart, handle]);
	const otherCount = useMemo(
		() => cart.filter((line) => line.resellerStore?.handle !== handle).reduce((total, line) => total + line.quantity, 0),
		[cart, handle],
	);
	const pricing = useMemo(() => getCartPricing(lines), [lines]);
	const itemCount = useMemo(() => lines.reduce((total, line) => total + line.quantity, 0), [lines]);
	const issues = useMemo(() => cartAvailabilityIssues(lines), [lines]);

	const setQuantity = useCallback(
		(id: CartProduct["id"], quantity: number) => {
			setCartProducts((current) =>
				current.map((line) => {
					if (String(line.id) !== String(id)) return line;
					const limit = Math.min(MAX_CART_QUANTITY, Number.isFinite(line.availableQuantity) ? Math.max(1, line.availableQuantity!) : MAX_CART_QUANTITY);
					return { ...line, quantity: Math.max(1, Math.min(limit, Math.round(quantity))) };
				}),
			);
		},
		[setCartProducts],
	);

	const remove = useCallback(
		(id: CartProduct["id"]) => setCartProducts((current) => current.filter((line) => String(line.id) !== String(id))),
		[setCartProducts],
	);

	/** Undo a removal: put the line back where it was. */
	const restore = useCallback(
		(line: CartProduct, index: number) =>
			setCartProducts((current) => {
				if (current.some((entry) => String(entry.id) === String(line.id))) return current;
				const next = [...current];
				next.splice(Math.min(index, next.length), 0, line);
				return next;
			}),
		[setCartProducts],
	);

	/** After an order: drop only this store's lines; anything else stays. */
	const clearStoreLines = useCallback(
		() => setCartProducts((current) => current.filter((line) => line.resellerStore?.handle !== handle)),
		[handle, setCartProducts],
	);

	return { clearStoreLines, hydrated, issues, itemCount, lines, otherCount, pricing, remove, restore, setQuantity };
}
