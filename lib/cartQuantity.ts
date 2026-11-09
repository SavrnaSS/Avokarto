import type { CartProduct, Product } from "@/types";
import { priceWithBundles } from "@/lib/bundleDiscount";

export const MAX_CART_QUANTITY = 99;

// Matches the definition AddToCart/QuickView2 already used inline: any of
// these three fields, from either the live DB-backed product (inStock,
// availableQuantity) or the static demo catalogs (isStockOut), can flag a
// product as unavailable - centralized so Buy Now/Add To Cart buttons don't
// each re-implement (and risk drifting from) this check.
export function isProductOutOfStock(product: Product) {
	return (
		product.inStock === false ||
		product.isStockOut === true ||
		(typeof product.availableQuantity === "number" &&
			product.availableQuantity <= 0)
	);
}

export function normalizeCartQuantity(value: unknown, fallback = 1) {
  const numericValue =
    typeof value === "number" ? value : Number.parseInt(String(value), 10);

  if (!Number.isFinite(numericValue)) {
    return fallback;
  }

  return Math.min(
    Math.max(Math.trunc(numericValue), 1),
    MAX_CART_QUANTITY,
  );
}

export function normalizeCartProduct(
  product: Product,
  quantity: unknown = 1,
): CartProduct {
  const price = Number(product.price);

  return {
    ...product,
    quantity: normalizeCartQuantity(quantity),
    price: Number.isFinite(price) ? Math.max(0, price) : 0,
  };
}

export function normalizeCartProducts(products: unknown): CartProduct[] {
  if (!Array.isArray(products)) return [];

  return products
    .map((product) => {
      if (!product || typeof product !== "object" || !("id" in product)) {
        return undefined;
      }

      const cartProduct = product as Product & { quantity?: unknown };
      return normalizeCartProduct(cartProduct, cartProduct.quantity);
    })
    .filter((product): product is CartProduct => Boolean(product));
}

export function getCartItemCount(products: readonly CartProduct[]) {
  return products.reduce((total, product) => total + product.quantity, 0);
}

/**
 * Merchandise pricing for the cart: subtotal before discounts, the bundle
 * discount, and the total actually charged for the items (same rule the
 * server checkout applies).
 */
export function getCartPricing(products: readonly CartProduct[]) {
  return priceWithBundles(
    products.map((product) => ({
      key: String(product.id),
      bundleId: product.bundleId,
      unitPrice: product.price,
      quantity: product.quantity,
    })),
  );
}

/** What the cart's items cost after any bundle discount. */
export function getCartTotalPrice(products: readonly CartProduct[]) {
  return getCartPricing(products).total;
}
