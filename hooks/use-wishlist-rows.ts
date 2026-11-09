"use client";

import { useMemo } from "react";
import { useContextElement } from "@/context/Context";
import { useLiveProductsByIds } from "@/hooks/use-live-products-by-ids";
import type { Product } from "@/types";

const LOW_STOCK_THRESHOLD = 5;

export type WishlistAvailability =
  | "checking"
  | "in-stock"
  | "low"
  | "out"
  | "unavailable"
  | "unknown";

export type WishlistRow = {
  key: string;
  // What the shopper saved (own wishlist only) - used to remove it and to
  // spot price drops since saving.
  saved?: Product;
  // Freshest data available: live catalog data when loaded, else the saved
  // snapshot (e.g. demo products without a catalog id).
  product: Product;
  availability: WishlistAvailability;
  priceDrop: number;
};

function availabilityOf(live: Product): WishlistAvailability {
  if (live.inStock === false || live.isStockOut) return "out";
  if (typeof live.availableQuantity === "number") {
    if (live.availableQuantity <= 0) return "out";
    if (live.availableQuantity <= LOW_STOCK_THRESHOLD) return "low";
  }
  return "in-stock";
}

/** Whether a row can be added to the cart right now. */
export function canBuyWishlistRow(row: WishlistRow) {
  return (
    row.availability === "in-stock" ||
    row.availability === "low" ||
    row.availability === "unknown"
  );
}

export function wishlistItemCount(count: number) {
  return `${count} ${count === 1 ? "item" : "items"}`;
}

/**
 * The shopper's wishlist (or a shared list of catalog ids) merged with live
 * catalog data: current price/stock/title/image, price drops since saving,
 * and products that no longer exist. Shared by the wishlist page and the
 * header wishlist popup so both always agree.
 */
export function useWishlistRows({
  sharedIds,
  enabled = true,
}: {
  sharedIds?: string[];
  // false skips the live lookup (e.g. while a popup is closed).
  enabled?: boolean;
} = {}) {
  const { wishList, mounted } = useContextElement();
  const isShared = Boolean(sharedIds?.length);
  const saved = useMemo(() => (mounted ? wishList : []), [mounted, wishList]);

  const catalogIds = useMemo(
    () =>
      !enabled
        ? []
        : isShared
          ? (sharedIds ?? [])
          : saved
              .map((item) => item.catalogId)
              .filter((id): id is string => Boolean(id)),
    [enabled, isShared, sharedIds, saved],
  );
  const live = useLiveProductsByIds(catalogIds);

  const rows = useMemo<WishlistRow[]>(() => {
    const statusFor = (catalogId: string | undefined): WishlistAvailability => {
      if (!catalogId) return "unknown";
      const product = live.products.get(catalogId);
      if (product) return availabilityOf(product);
      return live.resolved.has(catalogId) ? "unavailable" : "checking";
    };

    if (isShared) {
      return [...new Set(sharedIds)].flatMap((catalogId) => {
        const product = live.products.get(catalogId);
        // A shared link only knows ids - nothing to show until loaded.
        if (!product) return [];
        return [
          { key: catalogId, product, availability: statusFor(catalogId), priceDrop: 0 },
        ];
      });
    }

    return saved.map((item) => {
      const fresh = item.catalogId ? live.products.get(item.catalogId) : undefined;
      const drop = fresh ? item.price - fresh.price : 0;
      return {
        key: String(item.catalogId ?? item.id),
        saved: item,
        product: fresh ?? item,
        availability: statusFor(item.catalogId),
        priceDrop: drop >= 0.01 ? drop : 0,
      };
    });
  }, [isShared, sharedIds, saved, live.products, live.resolved]);

  return { rows, live, isShared, mounted };
}
