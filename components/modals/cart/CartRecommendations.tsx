"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useContextElement } from "@/context/Context";
import { useLiveProducts } from "@/hooks/use-live-products";
import { useTopSellingProducts } from "@/hooks/use-top-selling-products";
import { useCurrency } from "@/lib/currency";
import { calculateDiscountPercentage } from "@/lib/price";
import {
  getProductDetailsHref,
  withProductDetailsPageUrl,
} from "@/lib/productLinks";
import type { Product } from "@/types";
import styles from "./CartRecommendations.module.css";

const MAX_RECOMMENDATIONS = 8;
const POOL_SIZE = 16;
const LOW_STOCK_THRESHOLD = 5;

function productKey(product: Product) {
  return product.catalogId ?? product.slug ?? String(product.id);
}

function isPurchasable(product: Product) {
  if (product.inStock === false || product.isStockOut) return false;
  if (typeof product.availableQuantity === "number") {
    return product.availableQuantity > 0;
  }
  return product.price > 0;
}

function categoriesOf(product: Product) {
  return [...(product.category ?? []), ...(product.filterCategory ?? [])].map(
    (value) => value.trim().toLowerCase(),
  );
}

type Recommendation = {
  product: Product;
  unlocksFreeShipping: boolean;
  bestseller: boolean;
};

function rankRecommendations({
  cartProducts,
  pools,
  bestsellerKeys,
  amountToFreeShipping,
  keep,
}: {
  cartProducts: Product[];
  pools: Product[][];
  bestsellerKeys: Map<string, number>;
  amountToFreeShipping: number;
  keep: ReadonlySet<string>;
}): Recommendation[] {
  const cartIds = new Set(cartProducts.map((item) => String(item.id)));
  // Weight each category by how many cart lines share it, so the dominant
  // theme of the cart drives suggestions.
  const cartCategories = new Map<string, number>();
  for (const item of cartProducts) {
    for (const category of new Set(categoriesOf(item))) {
      cartCategories.set(category, (cartCategories.get(category) ?? 0) + 1);
    }
  }
  const needsShipping = cartProducts.length > 0 && amountToFreeShipping > 0;

  const seen = new Set<string>();
  const ranked: (Recommendation & { score: number; order: number })[] = [];
  let order = 0;

  for (const pool of pools) {
    for (const product of pool) {
      const key = productKey(product);
      if (seen.has(key)) continue;
      seen.add(key);
      // Already-in-cart items drop out - except ones added from this rail,
      // which stay put (showing a check) so the list doesn't jump under the
      // shopper's finger.
      if (cartIds.has(String(product.id)) && !keep.has(key)) continue;
      if (!isPurchasable(product) || !(product.price > 0)) continue;

      let score = 0;
      for (const category of new Set(categoriesOf(product))) {
        score += (cartCategories.get(category) ?? 0) * 4;
      }
      const bestsellerRank = bestsellerKeys.get(key);
      if (bestsellerRank !== undefined) {
        score += 3 * (1 - bestsellerRank / Math.max(bestsellerKeys.size, 1));
      }
      const unlocksFreeShipping =
        needsShipping && !cartIds.has(String(product.id)) &&
        Math.round(product.price * 100) >= Math.round(amountToFreeShipping * 100);
      if (unlocksFreeShipping) {
        // Prefer the cheapest item that closes the gap.
        score += 4 - Math.min(product.price / amountToFreeShipping - 1, 3);
      } else if (needsShipping) {
        score += 1; // still moves the free-shipping bar
      }
      score += Math.min(product.rating ?? 0, 5) * 0.3;

      ranked.push({
        product,
        unlocksFreeShipping,
        bestseller: bestsellerRank !== undefined && bestsellerRank < 3,
        score,
        order: order++,
      });
    }
  }

  return ranked
    .sort((a, b) => b.score - a.score || a.order - b.order)
    .slice(0, MAX_RECOMMENDATIONS)
    .map(({ product, unlocksFreeShipping, bestseller }) => ({
      product,
      unlocksFreeShipping,
      bestseller,
    }));
}

export default function CartRecommendations({
  enabled,
  amountToFreeShipping,
}: {
  // Deferred until the drawer is first opened so pages don't pay for three
  // catalog requests nobody sees.
  enabled: boolean;
  amountToFreeShipping: number;
}) {
  const { cartProducts, addProductToCart, isAddedToCartProducts, mounted } =
    useContextElement();
  const { formatPrice } = useCurrency();

  // The cart's most common category seeds a related-products query.
  const leadCategory = useMemo(() => {
    const counts = new Map<string, number>();
    for (const item of cartProducts) {
      const category = item.category?.[0] ?? item.filterCategory?.[0];
      if (category) counts.set(category, (counts.get(category) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  }, [cartProducts]);

  // All three stay subscribed to the realtime "products" topic, so price,
  // stock and best-seller changes land here without a reload.
  const related = useLiveProducts({
    limit: POOL_SIZE,
    search: leadCategory,
    enabled: enabled && Boolean(leadCategory),
  });
  const bestsellers = useTopSellingProducts({
    period: "this-month",
    limit: POOL_SIZE,
    enabled,
  });
  const general = useLiveProducts({ limit: POOL_SIZE, enabled });

  const [addedHere, setAddedHere] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const [announcement, setAnnouncement] = useState("");

  const bestsellerKeys = useMemo(
    () =>
      new Map(
        bestsellers.products.map((product, index) => [
          productKey(product),
          index,
        ]),
      ),
    [bestsellers.products],
  );

  const recommendations = useMemo(
    () =>
      rankRecommendations({
        cartProducts: mounted ? cartProducts : [],
        pools: [related.products, bestsellers.products, general.products],
        bestsellerKeys,
        amountToFreeShipping,
        keep: addedHere,
      }),
    [
      mounted,
      cartProducts,
      related.products,
      bestsellers.products,
      general.products,
      bestsellerKeys,
      amountToFreeShipping,
      addedHere,
    ],
  );

  const loading =
    (related.loading && !related.hasData) ||
    (general.loading && !general.hasData);

  // ---- rail scrolling ----
  const railRef = useRef<HTMLUListElement>(null);
  const [scrollState, setScrollState] = useState({ prev: false, next: false });

  const syncScroll = useCallback(() => {
    const rail = railRef.current;
    if (!rail) return;
    const max = rail.scrollWidth - rail.clientWidth;
    setScrollState({ prev: rail.scrollLeft > 4, next: rail.scrollLeft < max - 4 });
  }, []);

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;
    syncScroll();
    const observer = new ResizeObserver(syncScroll);
    observer.observe(rail);
    return () => observer.disconnect();
  }, [syncScroll, recommendations.length, loading]);

  const scrollByCard = (direction: 1 | -1) => {
    const rail = railRef.current;
    const card = rail?.querySelector("li");
    if (!rail || !card) return;
    const gap = parseFloat(getComputedStyle(rail).columnGap) || 0;
    rail.scrollBy({ left: direction * (card.clientWidth + gap), behavior: "smooth" });
  };

  if (!enabled) return null;

  const hasCart = mounted && cartProducts.length > 0;

  if (!loading && !recommendations.length) return null;

  const heading = hasCart ? "Complete your order" : "Trending right now";
  const subheading = !hasCart
    ? "Best sellers and new picks from the store"
    : amountToFreeShipping > 0
      ? `Add ${formatPrice(amountToFreeShipping)} more for free shipping`
      : "Picked to go with what's in your cart";

  const handleAdd = (product: Product) => {
    if (isAddedToCartProducts(product.id)) return;
    addProductToCart(withProductDetailsPageUrl(product));
    setAddedHere((prev) => new Set(prev).add(productKey(product)));
    setAnnouncement(`${product.title} added to your cart.`);
  };

  return (
    <section className={styles.section} aria-labelledby="cart-recs-heading">
      <div className={styles.head}>
        <div className={styles.headText}>
          <h6 id="cart-recs-heading" className={styles.title}>
            {heading}
          </h6>
          <p className={styles.subtitle}>{subheading}</p>
        </div>
        {scrollState.prev || scrollState.next ? (
          <div className={styles.arrows}>
            <button
              type="button"
              className={styles.arrow}
              onClick={() => scrollByCard(-1)}
              disabled={!scrollState.prev}
              aria-label="Previous suggestions"
            >
              <i className="fa-solid fa-chevron-left" aria-hidden="true" />
            </button>
            <button
              type="button"
              className={styles.arrow}
              onClick={() => scrollByCard(1)}
              disabled={!scrollState.next}
              aria-label="More suggestions"
            >
              <i className="fa-solid fa-chevron-right" aria-hidden="true" />
            </button>
          </div>
        ) : null}
      </div>

      {loading ? (
        <ul className={styles.rail} aria-busy="true" aria-label="Loading suggestions">
          {[0, 1].map((index) => (
            <li key={index} className={`${styles.card} ${styles.skeleton}`}>
              <span className={styles.skeletonThumb} />
              <span className={styles.skeletonLines}>
                <span />
                <span />
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <ul ref={railRef} className={styles.rail} onScroll={syncScroll}>
          {recommendations.map(({ product, unlocksFreeShipping, bestseller }) => {
            const key = productKey(product);
            const href = getProductDetailsHref(product);
            const inCart = isAddedToCartProducts(product.id);
            const discount = calculateDiscountPercentage(
              product.price,
              product.oldPrice,
            );
            const lowStock =
              typeof product.availableQuantity === "number" &&
              product.availableQuantity <= LOW_STOCK_THRESHOLD;

            return (
              <li
                key={key}
                className={`${styles.card} ${inCart ? styles.cardAdded : ""}`}
              >
                <Link href={href} className={styles.thumb} aria-label={product.title}>
                  <Image src={product.imgSrc} alt="" fill sizes="80px" />
                  {discount ? (
                    <span className={styles.discount}>-{discount}%</span>
                  ) : null}
                </Link>

                <div className={styles.info}>
                  <Link href={href} className={styles.name}>
                    {product.title}
                  </Link>
                  <div className={styles.priceRow}>
                    <span className={styles.price}>{formatPrice(product.price)}</span>
                    {product.oldPrice && product.oldPrice > product.price ? (
                      <del className={styles.oldPrice}>
                        {formatPrice(product.oldPrice)}
                      </del>
                    ) : null}
                  </div>
                  {unlocksFreeShipping && !inCart ? (
                    <span className={`${styles.chip} ${styles.chipShip}`}>
                      <i className="fa-regular fa-truck-fast" aria-hidden="true" />
                      Unlocks free shipping
                    </span>
                  ) : lowStock ? (
                    <span className={`${styles.chip} ${styles.chipWarn}`}>
                      Only {product.availableQuantity} left
                    </span>
                  ) : bestseller ? (
                    <span className={styles.chip}>
                      <i className="fa-solid fa-fire" aria-hidden="true" />
                      Bestseller
                    </span>
                  ) : null}
                </div>

                <button
                  type="button"
                  className={styles.add}
                  onClick={() => handleAdd(product)}
                  disabled={inCart}
                  aria-label={
                    inCart ? `${product.title} is in your cart` : `Add ${product.title} to cart`
                  }
                  title={inCart ? "In your cart" : "Add to cart"}
                >
                  <i
                    className={inCart ? "fa-solid fa-check" : "fa-regular fa-cart-plus"}
                    aria-hidden="true"
                  />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <p className={styles.srOnly} role="status" aria-live="polite">
        {announcement}
      </p>
    </section>
  );
}
