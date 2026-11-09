"use client";

import { useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useContextElement, useStore } from "@/context/Context";
import { Product } from "@/types";
import {
  isProductOutOfStock,
  MAX_CART_QUANTITY,
  normalizeCartQuantity,
} from "@/lib/cartQuantity";
import {
  getProductDetailsPageUrlFromPath,
  withProductDetailsPageUrl,
} from "@/lib/productLinks";
import { useTranslation } from "@/lib/i18n/translations";

export function useCartQuantityAction(
  product: Product,
  detailsPageUrl?: string,
  maxQuantity = MAX_CART_QUANTITY,
) {
  const {
    addProductToCart, isAddedToCartProducts, updateQuantity, quantityInCart,
    quantityDrafts, setQuantityDraft, prepareCheckout, mounted,
  } = useContextElement();
  const quantityDraft = mounted ? quantityDrafts[String(product.id)] : undefined;
  const router = useRouter();
  const [isBuyingNow, startTransition] = useTransition();
  const pathname = usePathname();
  const { t } = useTranslation();
  const resolvedDetailsPageUrl =
    detailsPageUrl ?? getProductDetailsPageUrlFromPath(pathname);
  // A caller-supplied maxQuantity (e.g. an explicit stock count) can only
  // ever narrow the global cap, never widen past it.
  const stock = product.availableQuantity;
  const stockLimit =
    typeof stock === "number" && Number.isFinite(stock)
      ? Math.max(0, Math.trunc(stock))
      : MAX_CART_QUANTITY;
  const quantityLimit = Math.max(
    1,
    Math.min(MAX_CART_QUANTITY, Math.trunc(maxQuantity || 1), stockLimit),
  );
  const normalizeAvailableQuantity = (value: unknown) =>
    Math.min(normalizeCartQuantity(value), quantityLimit);

  const isOutOfStock = isProductOutOfStock(product);
  const isInCart = isAddedToCartProducts(product.id);
  const cartQty = quantityInCart(product.id);
  const quantity = normalizeAvailableQuantity(quantityDraft ?? (cartQty || 1));
  const isSameAsCart = isInCart && quantity === cartQty;

  const buttonLabel = isOutOfStock
    ? t("Out of Stock")
    : isInCart
      ? isSameAsCart
        ? t("Already Added")
        : t("Update Cart")
      : t("Add To Cart");

  const applyCartAction = () => {
    if (isSameAsCart || isOutOfStock) return;
    const normalizedQuantity = normalizeAvailableQuantity(quantity);

    if (isInCart) {
      updateQuantity(product.id, normalizedQuantity);
    } else {
      addProductToCart(
        withProductDetailsPageUrl(product, resolvedDetailsPageUrl),
        normalizedQuantity,
      );
    }

    setQuantityDraft(product.id, undefined);
  };

  const isBuyNowDisabled = !mounted || isOutOfStock || isBuyingNow ||
    !product.id || !Number.isFinite(Number(product.price)) || Number(product.price) < 0;

  const buyNow = () => {
    if (isBuyNowDisabled) return false;
    // Read the latest selection at click time, including edits made before
    // React has committed the selector's next render.
    const current = useStore.getState();
    const selectedQuantity = current.quantityDrafts[String(product.id)] ??
      (current.quantityInCart(product.id) || 1);
    const prepared = prepareCheckout(
      withProductDetailsPageUrl(product, resolvedDetailsPageUrl),
      normalizeAvailableQuantity(selectedQuantity),
    );
    if (!prepared) return false;
    startTransition(() => router.push("/checkout-shipping"));
    return true;
  };

  return {
    quantity,
    setQuantity: (nextQuantity: number) =>
      setQuantityDraft(product.id, normalizeAvailableQuantity(nextQuantity)),
    buttonLabel,
    isDisabled: isSameAsCart || isOutOfStock,
    isOutOfStock,
    quantityLimit,
    applyCartAction,
    buyNow,
    isBuyingNow,
    isBuyNowDisabled,
  };
}
