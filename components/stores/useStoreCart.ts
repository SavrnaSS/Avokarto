"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { useStore } from "@/context/store";
import { useUiStore } from "@/context/uiStore";
import { MAX_CART_QUANTITY } from "@/lib/cartQuantity";
import type { CartProduct } from "@/types";
import { trackStoreEvent } from "./storeAnalytics";
import { storeHref, useStoreSite } from "./storeSite";

export type StoreCartItem = {
	cartId: number | string;
	imageUrl: string;
	listingId: string;
	name: string;
	price: number;
	productId: string;
	slug: string;
	stock: number;
	store: { handle: string; name: string };
};

function toCartLine(item: StoreCartItem, quantity: number): CartProduct {
	return {
		availableQuantity: item.stock,
		catalogId: item.productId,
		id: item.cartId,
		imgSrc: item.imageUrl,
		inStock: item.stock > 0,
		price: item.price,
		quantity,
		resellerListingId: item.listingId,
		resellerStore: item.store,
		slug: item.slug,
		title: item.name,
	};
}

/**
 * Put a store item in the cart at the store's price, attributed to the store
 * so the reseller earns the margin. Adding a product that's already in the
 * cart (from the main shop or another store) switches it to this store.
 */
export function useStoreCart() {
	const router = useRouter();
	const setCartProducts = useStore((state) => state.setCartProducts);
	const openModal = useUiStore((state) => state.openSpecificBsModal);
	// Inside a store: its own cart drawer and checkout. (Outside one, e.g. a
	// stray import elsewhere, fall back to Avokarto's.)
	const site = useStoreSite();

	const put = useCallback(
		(item: StoreCartItem, quantity: number, replaceQuantity: boolean) => {
			const limit = Math.max(0, Math.min(item.stock, MAX_CART_QUANTITY));
			if (limit < 1) return false;
			trackStoreEvent(item.store.handle, "add_to_cart", item.slug);
			setCartProducts((current) => {
				const existing = current.find((line) => String(line.id) === String(item.cartId));
				const nextQuantity = Math.min(limit, replaceQuantity || !existing ? quantity : existing.quantity + quantity);
				const line = { ...existing, ...toCartLine(item, nextQuantity), bundleId: existing?.bundleId };
				return existing
					? current.map((entry) => (String(entry.id) === String(item.cartId) ? line : entry))
					: [...current, line];
			});
			return true;
		},
		[setCartProducts],
	);

	const addToCart = useCallback(
		(item: StoreCartItem, quantity = 1) => {
			if (!put(item, quantity, false)) return;
			if (site) site.openCart();
			else openModal("cartSidebar");
		},
		[openModal, put, site],
	);

	const buyNow = useCallback(
		(item: StoreCartItem, quantity = 1) => {
			if (put(item, quantity, true)) router.push(site ? storeHref(site.basePath, "/checkout") : "/checkout-shipping");
		},
		[put, router, site],
	);

	return { addToCart, buyNow };
}
