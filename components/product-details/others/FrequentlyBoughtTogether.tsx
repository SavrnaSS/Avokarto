"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState, type CSSProperties, type MouseEvent } from "react";
import {
  Eye,
  Flame,
  ImageOff,
  History,
  Layers,
  RefreshCw,
  Star,
  Tag,
  type LucideIcon,
} from "lucide-react";
import { useContextElement, useStore } from "@/context/Context";
import { useUiElement } from "@/context/uiStore";
import { useLiveProducts } from "@/hooks/use-live-products";
import {
  clearRecentlyViewed,
  useRecentlyViewedProducts,
} from "@/hooks/use-recently-viewed";
import { useTopSellingProducts } from "@/hooks/use-top-selling-products";
import { useCurrency } from "@/lib/currency";
import { useStorePolicy } from "@/hooks/useStorePolicy";
import { getFreeShippingRemaining, qualifiesForFreeShipping } from "@/lib/shippingPolicy";
import {
  BUNDLE_DISCOUNT_PERCENT,
  BUNDLE_MIN_ITEMS,
  bundleUnitPrice,
  newBundleId,
  priceWithBundles,
} from "@/lib/bundleDiscount";
import { calculateDiscountPercentage } from "@/lib/price";
import {
  getProductDetailsHref,
  withProductDetailsPageUrl,
} from "@/lib/productLinks";
import DataBoundary from "@/components/common/loading/DataBoundary";
import type { Product } from "@/types";
import styles from "./FrequentlyBoughtTogether.module.css";

// Companions shown next to the product being viewed (so a full bundle is
// this item + 3).
const COMPANION_COUNT = 3;
// Pull a wider pool than we show so category filtering still leaves a full
// bundle plus alternates to swap in.
const CANDIDATE_POOL = 24;
// Same default as the "Recently viewed" tab on this page, so both share one
// de-duplicated request for the visitor's history.
const RECENT_LIMIT = 6;
const LOW_STOCK_THRESHOLD = 5;

type Reason = "recent" | "category" | "bestseller" | "rated" | "deal";

const REASON_LABEL: Record<Reason, { Icon: LucideIcon; text: string }> = {
  recent: { Icon: History, text: "Recently viewed" },
  category: { Icon: Layers, text: "Same category" },
  bestseller: { Icon: Flame, text: "Bestseller" },
  rated: { Icon: Star, text: "Top rated" },
  deal: { Icon: Tag, text: "On sale" },
};

// Where the bundle's suggestions came from - drives the heading copy.
type Source = "recent" | "category" | "popular";

type Candidate = {
  product: Product;
  score: number;
  reason: Reason | null;
  source: Source;
};

function productKey(product: Product) {
  return product.catalogId ?? product.slug ?? String(product.id);
}

function isSameProduct(a: Product, b: Product) {
  if (a.catalogId && b.catalogId) return a.catalogId === b.catalogId;
  if (a.slug && b.slug) return a.slug === b.slug;
  return String(a.id) === String(b.id);
}

function isPurchasable(product: Product) {
  if (product.inStock === false || product.isStockOut) return false;
  if (typeof product.availableQuantity === "number") {
    return product.availableQuantity > 0;
  }
  return true;
}

function hasOptions(product: Product) {
  return Boolean(
    product.filterSizes?.length ||
    product.colorVariants?.length ||
    product.variants?.length,
  );
}

function lowerSet(values?: readonly string[]) {
  return new Set((values ?? []).map((value) => value.trim().toLowerCase()));
}

// Relevance score for a candidate companion: shared categories dominate,
// shared tags/brand refine, then store-wide popularity, price fit (add-ons
// costing no more than ~1.5x the anchor convert best) and ratings. The
// strongest *true* signal also becomes the "why this" label.
function scoreCandidate(
  anchor: Product,
  candidate: Product,
  bestsellerRank: number | undefined,
  bestsellerCount: number,
): Candidate {
  const anchorCategories = lowerSet([
    ...(anchor.category ?? []),
    ...(anchor.filterCategory ?? []),
  ]);
  const anchorTags = lowerSet(anchor.tags);
  let score = 0;
  let sharesCategory = false;

  for (const category of lowerSet([
    ...(candidate.category ?? []),
    ...(candidate.filterCategory ?? []),
  ])) {
    if (anchorCategories.has(category)) {
      score += 6;
      sharesCategory = true;
    }
  }
  for (const tag of lowerSet(candidate.tags)) {
    if (anchorTags.has(tag)) score += 2;
  }
  if (anchor.brand && candidate.brand && anchor.brand === candidate.brand) {
    score += 2;
  }
  if (bestsellerRank !== undefined) {
    score += 3 * (1 - bestsellerRank / Math.max(bestsellerCount, 1));
  }
  if (anchor.price > 0 && candidate.price <= anchor.price * 1.5) score += 1.5;
  score += Math.min(candidate.rating ?? 0, 5) * 0.3;
  score += Math.min(Math.log10((candidate.reviewCount ?? 0) + 1), 2) * 0.5;

  const discount = calculateDiscountPercentage(
    candidate.price,
    candidate.oldPrice,
  );
  const reason: Reason | null = sharesCategory
    ? "category"
    : bestsellerRank !== undefined && bestsellerRank < 5
      ? "bestseller"
      : (candidate.rating ?? 0) >= 4.5 && (candidate.reviewCount ?? 0) >= 5
        ? "rated"
        : discount && discount >= 10
          ? "deal"
          : null;

  return { product: candidate, score, reason, source: "popular" };
}

function categoriesOf(product: Product) {
  return lowerSet([...(product.category ?? []), ...(product.filterCategory ?? [])]);
}

function isEligible(anchor: Product, candidate: Product) {
  return (
    !isSameProduct(candidate, anchor) &&
    isPurchasable(candidate) &&
    candidate.price > 0
  );
}

/**
 * Tiered candidate list, in the order slots (and swaps) consume it:
 *  1. the visitor's recently viewed products, most recent first;
 *  2. products in the same category as this one, best match first
 *     (strict category match - the category search can also hit names);
 *  3. only if 1 + 2 can't fill the bundle: this month's best-sellers.
 */
function buildCandidates({
  anchor,
  recent,
  related,
  popular,
  bestsellerRanks,
}: {
  anchor: Product;
  recent: Product[];
  related: Product[];
  popular: Product[];
  bestsellerRanks: Map<string, number>;
}): Candidate[] {
  const seen = new Set<string>();
  const take = (candidate: Product) => {
    const key = productKey(candidate);
    if (seen.has(key) || !isEligible(anchor, candidate)) return false;
    seen.add(key);
    return true;
  };
  const score = (candidate: Product) =>
    scoreCandidate(
      anchor,
      candidate,
      bestsellerRanks.get(productKey(candidate)),
      bestsellerRanks.size,
    );

  const tierRecent: Candidate[] = recent
    .filter(take)
    .map((candidate) => ({
      ...score(candidate),
      reason: "recent",
      source: "recent",
    }));

  const anchorCategories = categoriesOf(anchor);
  const tierCategory: Candidate[] = anchorCategories.size
    ? related
        .filter((candidate) =>
          [...categoriesOf(candidate)].some((category) =>
            anchorCategories.has(category),
          ),
        )
        .filter(take)
        .map((candidate) => ({
          ...score(candidate),
          reason: "category" as const,
          source: "category" as const,
        }))
        .sort((a, b) => b.score - a.score)
    : [];

  const primary = [...tierRecent, ...tierCategory];
  if (primary.length >= COMPANION_COUNT) return primary;

  const tierPopular = popular
    .filter(take)
    .map((candidate) => score(candidate))
    .sort((a, b) => b.score - a.score);

  return [...primary, ...tierPopular];
}

// Fill each slot from the ranked list, honouring shopper swaps (slot ->
// product key) as long as the swapped-in product is still available.
function resolveSlots(ranked: Candidate[], swaps: Record<number, string>) {
  const byKey = new Map(
    ranked.map((entry) => [productKey(entry.product), entry]),
  );
  const used = new Set<string>();
  const slots: (Candidate | undefined)[] = [];

  for (let slot = 0; slot < COMPANION_COUNT; slot++) {
    const swapped = swaps[slot] ? byKey.get(swaps[slot]) : undefined;
    if (swapped && !used.has(swaps[slot])) {
      slots[slot] = swapped;
      used.add(swaps[slot]);
    }
  }
  let cursor = 0;
  for (let slot = 0; slot < COMPANION_COUNT; slot++) {
    if (slots[slot]) continue;
    while (
      cursor < ranked.length &&
      used.has(productKey(ranked[cursor].product))
    ) {
      cursor++;
    }
    if (cursor >= ranked.length) break;
    slots[slot] = ranked[cursor];
    used.add(productKey(ranked[cursor].product));
  }

  return slots.filter((entry): entry is Candidate => Boolean(entry));
}

// Rendered width per layout (see the container tiers in the CSS module):
// < 768px viewport -> compact row thumbnail; 768-991px -> 2x2 grid cards
// (~50% of a 720px container); >= 992px -> one row of cards capped at
// 230px. Accurate hints let next/image pick a sharp-but-small srcset entry
// instead of upscaling a thumbnail on tablets.
const IMAGE_SIZES = "(max-width: 767px) 112px, (max-width: 991px) 330px, 240px";

function ProductImage({ product }: { product: Product }) {
  // Keyed by URL so a product whose image is fixed/replaced live (realtime
  // update) gets a fresh attempt instead of staying on the fallback.
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  if (!product.imgSrc || failedSrc === product.imgSrc) {
    return (
      <span className={styles.imageFallback} role="img" aria-label={product.title}>
        <ImageOff size={24} strokeWidth={1.6} aria-hidden="true" />
      </span>
    );
  }

  return (
    <Image
      src={product.imgSrc}
      alt={product.title}
      fill
      sizes={IMAGE_SIZES}
      onError={() => setFailedSrc(product.imgSrc)}
    />
  );
}

function itemCount(count: number) {
  return `${count} ${count === 1 ? "item" : "items"}`;
}

// Placeholder built from the section's own layout classes, so cards, the
// "+"/"=" markers and the summary appear exactly where the real ones land.
function BundleSkeleton({ count }: { count: number }) {
  return (
    <div className={styles.body} aria-hidden="true">
      <div className={styles.rail} style={{ "--fbt-count": count } as CSSProperties}>
        <ol className={styles.items}>
          {Array.from({ length: count }, (_, index) => (
            <li key={index} className={`${styles.item} ${styles.itemSelected} ${styles.skeletonItem}`}>
              <div className={`${styles.media} ${styles.shimmer}`} />
              {/* Real wrappers (checkRow/priceRow/meta/inlineActions) so each
                  row gets the same size and shows/hides at the same widths. */}
              <div className={styles.info}>
                <div className={styles.checkRow}>
                  <span className={`${styles.itemTitle} ${styles.shimmer} ${styles.skTitle}`} />
                </div>
                <div className={styles.priceRow}>
                  <span className={`${styles.shimmer} ${styles.skPrice}`} />
                </div>
                <div className={styles.meta}>
                  <span className={`${styles.shimmer} ${styles.skChip}`} />
                </div>
                {index > 0 ? (
                  <div className={styles.inlineActions}>
                    <span className={`${styles.shimmer} ${styles.skPill}`} />
                    <span className={`${styles.shimmer} ${styles.skPill}`} />
                  </div>
                ) : null}
              </div>
            </li>
          ))}
        </ol>
      </div>
      <aside className={styles.summary}>
        <span className={`${styles.shimmer} ${styles.skLine} ${styles.skShort}`} />
        <span className={`${styles.shimmer} ${styles.skLine}`} />
        <span className={`${styles.shimmer} ${styles.skLine}`} />
        <span className={`${styles.shimmer} ${styles.skTotal}`} />
        <span className={`${styles.shimmer} ${styles.skLine} ${styles.skShort}`} />
        <div className={styles.shipping}>
          <span className={`${styles.shimmer} ${styles.skLine}`} />
          <span className={`${styles.shimmer} ${styles.skBar}`} />
        </div>
        <div className={styles.actions}>
          <span className={`${styles.shimmer} ${styles.skButton}`} />
          <span className={`${styles.shimmer} ${styles.skButton}`} />
        </div>
      </aside>
    </div>
  );
}

function ReasonTag({ reason }: { reason: Reason }) {
  const { Icon, text } = REASON_LABEL[reason];
  return (
    <span className={styles.reason}>
      <Icon size={11} strokeWidth={2.5} aria-hidden="true" />
      {text}
    </span>
  );
}

function Rating({ product }: { product: Product }) {
  const rating = product.rating ?? 0;
  if (!rating) return null;
  const count = product.reviewCount ?? product.ratingCount;

  return (
    <span
      className={styles.rating}
      aria-label={`Rated ${rating.toFixed(1)} out of 5`}
    >
      <i className="fa-solid fa-star" aria-hidden="true" />
      {rating.toFixed(1)}
      {count ? <span className={styles.ratingCount}>({count})</span> : null}
    </span>
  );
}

export default function FrequentlyBoughtTogether({
  product,
}: {
  product: Product;
}) {
  // Admin -> Settings -> Shipping: the live free-shipping rule.
  const { freeShipping } = useStorePolicy();
  const {
    addProductToCart,
    addBundleToCart,
    isAddedToCartProducts,
    addToWishlist,
    isAddedtoWishlist,
    totalPrice: cartTotal,
    cartProducts,
    mounted,
  } = useContextElement();
  const { showToaster, openSpecificBsModal } = useUiElement();
  const setQuickViewItem = useStore((state) => state.setQuickViewItem);
  const { formatPrice } = useCurrency();

  const category = product.category?.[0] ?? product.filterCategory?.[0];
  const anchorId = product.catalogId ?? String(product.id);

  // 1) Browsing history (localStorage ids -> live products). Refreshes when
  //    a product is viewed in this or another tab, and on realtime
  //    price/stock changes.
  const recent = useRecentlyViewedProducts({
    excludeId: anchorId,
    limit: RECENT_LIMIT,
  });
  // 2) Same-category catalog products (realtime via the "products" topic).
  const related = useLiveProducts({
    limit: CANDIDATE_POOL,
    search: category,
    enabled: Boolean(category),
  });

  const primaryLoading =
    recent.loading || (Boolean(category) && related.loading && !related.hasData);
  const primaryCount = useMemo(() => {
    const anchorCategories = categoriesOf(product);
    const keys = new Set<string>();
    for (const item of recent.products) {
      if (isEligible(product, item)) keys.add(productKey(item));
    }
    for (const item of related.products) {
      if (
        isEligible(product, item) &&
        [...categoriesOf(item)].some((c) => anchorCategories.has(c))
      ) {
        keys.add(productKey(item));
      }
    }
    return keys.size;
  }, [product, recent.products, related.products]);

  // 3) Fallback only - fetched just when history + category can't fill the
  //    bundle, so most product pages never make this request.
  const needsFallback = !primaryLoading && primaryCount < COMPANION_COUNT;
  const bestsellers = useTopSellingProducts({
    period: "this-month",
    limit: 16,
    enabled: needsFallback,
  });
  // Last resort behind best-sellers, so a thin catalog month still fills
  // the bundle.
  const catalog = useLiveProducts({ limit: 16, enabled: needsFallback });

  const bestsellerRanks = useMemo(
    () =>
      new Map(
        bestsellers.products.map((item, index) => [productKey(item), index]),
      ),
    [bestsellers.products],
  );

  const ranked = useMemo(
    () =>
      buildCandidates({
        anchor: product,
        recent: recent.products,
        related: related.products,
        popular: needsFallback
          ? [...bestsellers.products, ...catalog.products]
          : [],
        bestsellerRanks,
      }),
    [
      product,
      recent.products,
      related.products,
      needsFallback,
      bestsellers.products,
      catalog.products,
      bestsellerRanks,
    ],
  );

  const [swaps, setSwaps] = useState<Record<number, string>>({});
  const companions = useMemo(
    () => resolveSlots(ranked, swaps),
    [ranked, swaps],
  );
  const canSwap = ranked.length > companions.length;

  const items = useMemo(
    () => [
      { product, reason: null as Reason | null },
      ...companions.map(({ product: item, reason }) => ({
        product: item,
        reason,
      })),
    ],
    [product, companions],
  );

  // Track opt-outs rather than opt-ins: everything purchasable starts
  // selected (the bundle is the pitch) and newly loaded or swapped-in
  // companions join selected without a sync effect.
  const [deselected, setDeselected] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const [status, setStatus] = useState("");

  const isSelected = (item: Product) =>
    isPurchasable(item) && !deselected.has(productKey(item));

  const selectedItems = items
    .map(({ product: item }) => item)
    .filter(isSelected);
  const subtotal = selectedItems.reduce((sum, item) => sum + item.price, 0);
  const compareAt = selectedItems.reduce(
    (sum, item) =>
      sum +
      (item.oldPrice && item.oldPrice > item.price
        ? item.oldPrice
        : item.price),
    0,
  );
  const savings = compareAt - subtotal;

  const toAdd = selectedItems.filter((item) => !isAddedToCartProducts(item.id));
  const toSave = selectedItems.filter((item) => !isAddedtoWishlist(item.id));
  const allInCart = selectedItems.length > 0 && toAdd.length === 0;
  const allSaved = selectedItems.length > 0 && toSave.length === 0;

  // ---- bundle discount (same rule the cart and server checkout apply) ----
  const bundleEligible = selectedItems.length >= BUNDLE_MIN_ITEMS;
  const bundleTotal = bundleEligible
    ? selectedItems.reduce((sum, item) => sum + bundleUnitPrice(item.price), 0)
    : subtotal;
  const bundleDiscount = Math.max(0, subtotal - bundleTotal);
  const totalSavings = savings + bundleDiscount;
  const itemsNeededForBundle = Math.max(0, BUNDLE_MIN_ITEMS - selectedItems.length);
  // Already in the cart as ONE bundle (so the discount is applied there)?
  const cartLines = mounted ? cartProducts : [];
  const bundleIdsInCart = new Set(
    selectedItems.map(
      (item) =>
        cartLines.find((line) => String(line.id) === String(item.id))?.bundleId ?? "",
    ),
  );
  const bundledInCart =
    bundleEligible && allInCart && bundleIdsInCart.size === 1 && !bundleIdsInCart.has("");

  // Free-shipping outlook if the shopper adds this bundle: price the cart as
  // it would be afterwards, with the same bundle rule the cart uses.
  const currentCart = mounted ? cartTotal : 0;
  const projectedCart = (() => {
    if (!selectedItems.length) return currentCart;
    const previewId = "preview-bundle";
    const selectedIds = new Set(selectedItems.map((item) => String(item.id)));
    const lines = [
      ...cartLines
        .filter((line) => !(bundleEligible && selectedIds.has(String(line.id))))
        .map((line) => ({
          key: String(line.id),
          bundleId: line.bundleId,
          unitPrice: line.price,
          quantity: line.quantity,
        })),
      ...selectedItems
        .filter((item) => bundleEligible || !isAddedToCartProducts(item.id))
        .map((item) => ({
          key: String(item.id),
          bundleId: bundleEligible ? previewId : undefined,
          unitPrice: item.price,
          quantity:
            cartLines.find((line) => String(line.id) === String(item.id))?.quantity ?? 1,
        })),
    ];
    return priceWithBundles(lines).total;
  })();
  const shippingRemaining = getFreeShippingRemaining(projectedCart, freeShipping);
  const shippingProgress = freeShipping.thresholdUsd > 0
    ? ((freeShipping.thresholdUsd - shippingRemaining) / freeShipping.thresholdUsd) * 100
    : 100;
  const alreadyFree = qualifiesForFreeShipping(currentCart, freeShipping);
  const projectedFree = qualifiesForFreeShipping(projectedCart, freeShipping);
  const bundleUnlocksFree = !alreadyFree && projectedFree;

  const toggle = (item: Product) => {
    if (!isPurchasable(item)) return;
    const key = productKey(item);
    setDeselected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  // Clicking anywhere on a card toggles it - except its own controls.
  const handleCardClick = (event: MouseEvent<HTMLLIElement>, item: Product) => {
    if ((event.target as HTMLElement).closest("a, button, input, label"))
      return;
    toggle(item);
  };

  const swapSlot = (slot: number) => {
    const current = companions[slot];
    if (!current) return;
    const shown = new Set(companions.map((entry) => productKey(entry.product)));
    const start = ranked.findIndex(
      (entry) => productKey(entry.product) === productKey(current.product),
    );
    // Next-best candidate not already on screen, wrapping around.
    for (let step = 1; step <= ranked.length; step++) {
      const next = ranked[(start + step) % ranked.length];
      const key = productKey(next.product);
      if (!shown.has(key)) {
        // Pin every visible slot, not just the swapped one - otherwise the
        // displaced product re-fills a later slot from the ranking and
        // shuffles the rest of the bundle.
        setSwaps(
          Object.fromEntries(
            companions.map((entry, index) => [
              index,
              index === slot ? key : productKey(entry.product),
            ]),
          ),
        );
        setStatus(`Replaced with ${next.product.title}.`);
        return;
      }
    }
  };

  const openQuickView = (item: Product) => {
    setQuickViewItem(withProductDetailsPageUrl(item));
    openSpecificBsModal("quickViewModal");
  };

  const handleAddToCart = () => {
    if (bundleEligible) {
      // One bundle id for the whole set: new items are added and items
      // already in the cart join it, so everything gets the bundle price.
      addBundleToCart(
        selectedItems.map((item) => withProductDetailsPageUrl(item)),
        newBundleId(),
      );
      setStatus(
        toAdd.length
          ? `${itemCount(toAdd.length)} added to your cart with ${BUNDLE_DISCOUNT_PERCENT}% bundle savings.`
          : `Bundle discount applied to ${itemCount(selectedItems.length)} in your cart.`,
      );
      openSpecificBsModal("cartSidebar");
      return;
    }
    if (!toAdd.length) return;
    toAdd.forEach((item) => addProductToCart(withProductDetailsPageUrl(item)));
    setStatus(`${itemCount(toAdd.length)} added to your cart.`);
    // Show the result where it lives - the cart drawer (which also carries
    // live free-shipping progress and further suggestions).
    openSpecificBsModal("cartSidebar");
  };

  const handleSave = () => {
    if (!toSave.length) return;
    // addToWishlist toggles, so only ever pass items not already saved.
    toSave.forEach((item) => addToWishlist(item));
    showToaster(`${itemCount(toSave.length)} saved to your wishlist`);
    setStatus(`${itemCount(toSave.length)} saved to your wishlist.`);
  };

  // Wait for the pools' first load so the ranked bundle doesn't reshuffle
  // in front of the shopper; later background refreshes keep showing data.
  const loading =
    primaryLoading ||
    (needsFallback &&
      ((bestsellers.loading && !bestsellers.hasData) ||
        (catalog.loading && !catalog.hasData)));
  const ready = !primaryLoading;
  // History failures degrade silently to category/popular picks; only a
  // failure that leaves nothing to show surfaces the retry UI.
  const error =
    ranked.length === 0
      ? (related.error ??
        (needsFallback ? (bestsellers.error ?? catalog.error) : null))
      : null;
  const retry = () => {
    void recent.refresh();
    related.refresh();
    if (needsFallback) {
      bestsellers.refresh();
      catalog.refresh();
    }
  };

  const sources = new Set(companions.map((entry) => entry.source));
  const fromHistory = sources.has("recent");
  // Neutral copy while suggestions load, so the heading doesn't flip from a
  // fallback ("Popular add-ons") to the real one.
  const heading = loading
    ? "Complete the set"
    : fromHistory
    ? "Pair it with your recent finds"
    : sources.has("category")
      ? "Complete the set"
      : "Popular add-ons";
  const subheading = loading
    ? "Finding items that go well with this one."
    : fromHistory
    ? "Items you viewed recently, ready to add alongside this one."
    : sources.has("category") && category
      ? `More from ${category}, picked to go with this item.`
      : "Customer favorites this month.";

  // A "bundle" of just the current product isn't worth a section.
  if (ready && !loading && !companions.length) return null;

  const selectionSummary = !selectedItems.length
    ? "No items selected"
    : selectedItems.length === items.length
      ? `${itemCount(items.length)} selected`
      : `${selectedItems.length} of ${itemCount(items.length)} selected`;

  const addLabel = !selectedItems.length
    ? "Select items to add"
    : bundleEligible && !toAdd.length
      ? "Apply bundle discount"
      : toAdd.length === selectedItems.length
        ? toAdd.length === 1
          ? "Add to cart"
          : `Add ${itemCount(toAdd.length)} to cart`
        : `Add ${toAdd.length} more ${toAdd.length === 1 ? "item" : "items"} to cart`;

  const amountToFree = formatPrice(shippingRemaining);

  return (
    <section className={styles.section} aria-labelledby="fbt-heading">
      <div className="container">
        <div className={styles.panel}>
          <header className={styles.header}>
            <span className={styles.headerIcon} aria-hidden="true">
              <i className="fa-regular fa-cube" />
            </span>
            <div>
              <h2 id="fbt-heading" className={styles.title}>
                {heading}
              </h2>
              <p className={styles.subtitle}>{subheading}</p>
              <p className={styles.offer}>
                <span className={styles.offerBadge}>
                  Bundle &amp; save {BUNDLE_DISCOUNT_PERCENT}%
                </span>
                <span className={styles.offerText}>
                  Buy {BUNDLE_MIN_ITEMS} or more together and get{" "}
                  {BUNDLE_DISCOUNT_PERCENT}% off each item.
                </span>
              </p>
              {fromHistory ? (
                <button
                  type="button"
                  className={styles.clearHistory}
                  onClick={() => {
                    clearRecentlyViewed();
                    setSwaps({});
                    setStatus("Recently viewed items cleared.");
                  }}
                >
                  Clear recently viewed
                </button>
              ) : null}
            </div>
          </header>

          <DataBoundary
            loading={loading}
            error={error}
            ready={ready}
            onRetry={retry}
            count={COMPANION_COUNT + 1}
            label="Loading bundle suggestions"
            skeleton={<BundleSkeleton count={COMPANION_COUNT + 1} />}
          >
            <div className={styles.body}>
              {/* The rail is a size container: card layout follows the
                  space the section actually gets, not the viewport. */}
              <div
                className={styles.rail}
                style={{ "--fbt-count": items.length } as CSSProperties}
              >
                <ol className={styles.items}>
                  {items.map(({ product: item, reason }, index) => {
                    const key = productKey(item);
                    const selected = isSelected(item);
                    const purchasable = isPurchasable(item);
                    const isAnchor = index === 0;
                    const slot = index - 1;
                    const inCart = isAddedToCartProducts(item.id);
                    const discount = calculateDiscountPercentage(
                      item.price,
                      item.oldPrice,
                    );
                    const lowStock =
                      typeof item.availableQuantity === "number" &&
                      item.availableQuantity > 0 &&
                      item.availableQuantity <= LOW_STOCK_THRESHOLD;
                    const href = getProductDetailsHref(item);
                    const checkboxId = `fbt-${key}`;

                    return (
                      <li
                        key={key}
                        className={`${styles.item} ${selected ? styles.itemSelected : ""} ${
                          purchasable ? "" : styles.itemDisabled
                        }`}
                        onClick={(event) => handleCardClick(event, item)}
                      >
                        <div className={styles.media}>
                          {isAnchor ? (
                            <ProductImage product={item} />
                          ) : (
                            <Link href={href} aria-label={item.title}>
                              <ProductImage product={item} />
                            </Link>
                          )}
                          {discount ? (
                            <span className={styles.discount}>
                              -{discount}%
                            </span>
                          ) : null}
                          {isAnchor ? (
                            <span className={styles.anchorTag}>This item</span>
                          ) : (
                            <div className={styles.mediaActions}>
                              <button
                                type="button"
                                className={styles.mediaBtn}
                                onClick={() => openQuickView(item)}
                                aria-label={`Quick view ${item.title}`}
                                title="Quick view"
                              >
                                <Eye
                                  size={16}
                                  strokeWidth={2}
                                  aria-hidden="true"
                                />
                              </button>
                              {canSwap ? (
                                <button
                                  type="button"
                                  className={styles.mediaBtn}
                                  onClick={() => swapSlot(slot)}
                                  aria-label={`Replace ${item.title} with another suggestion`}
                                  title="Show another suggestion"
                                >
                                  <RefreshCw
                                    size={15}
                                    strokeWidth={2}
                                    aria-hidden="true"
                                  />
                                </button>
                              ) : null}
                            </div>
                          )}
                        </div>

                        <div className={styles.info}>
                          <div className={styles.checkRow}>
                            <input
                              id={checkboxId}
                              type="checkbox"
                              className={styles.checkbox}
                              checked={selected}
                              disabled={!purchasable}
                              onChange={() => toggle(item)}
                            />
                            <label
                              htmlFor={checkboxId}
                              className={styles.itemTitle}
                            >
                              {item.title}
                            </label>
                          </div>

                          <div className={styles.priceRow}>
                            {bundleEligible && selected ? (
                              <>
                                <span
                                  className={styles.price}
                                  aria-label={`Bundle price ${formatPrice(bundleUnitPrice(item.price))}, regular price ${formatPrice(item.price)}`}
                                >
                                  {formatPrice(bundleUnitPrice(item.price))}
                                </span>
                                <del className={styles.oldPrice} aria-hidden="true">
                                  {formatPrice(item.price)}
                                </del>
                              </>
                            ) : (
                              <>
                                <span className={styles.price}>
                                  {formatPrice(item.price)}
                                </span>
                                {item.oldPrice && item.oldPrice > item.price ? (
                                  <del className={styles.oldPrice}>
                                    {formatPrice(item.oldPrice)}
                                  </del>
                                ) : null}
                              </>
                            )}
                            <Rating product={item} />
                          </div>

                          <div className={styles.meta}>
                            {reason ? <ReasonTag reason={reason} /> : null}
                            {!purchasable ? (
                              <span className={styles.metaMuted}>
                                Out of stock
                              </span>
                            ) : lowStock ? (
                              <span className={styles.metaWarn}>
                                Only {item.availableQuantity} left
                              </span>
                            ) : null}
                            {inCart ? (
                              <span className={styles.metaOk}>
                                <i
                                  className="fa-solid fa-check"
                                  aria-hidden="true"
                                />{" "}
                                In cart
                              </span>
                            ) : null}
                            {!isAnchor && hasOptions(item) ? (
                              <button
                                type="button"
                                className={`${styles.metaLink} ${styles.optionsLink}`}
                                onClick={() => openQuickView(item)}
                              >
                                View options
                              </button>
                            ) : null}
                          </div>

                          {/* Narrow rows: labelled, thumb-sized buttons replace
                              the image overlay (too cramped on a small thumb). */}
                          {!isAnchor ? (
                            <div className={styles.inlineActions}>
                              <button
                                type="button"
                                className={styles.inlineBtn}
                                onClick={() => openQuickView(item)}
                                aria-label={`Quick view ${item.title}`}
                              >
                                <Eye size={15} strokeWidth={2} aria-hidden="true" />
                                {hasOptions(item) ? "Options" : "Details"}
                              </button>
                              {canSwap ? (
                                <button
                                  type="button"
                                  className={styles.inlineBtn}
                                  onClick={() => swapSlot(slot)}
                                  aria-label={`Replace ${item.title} with another suggestion`}
                                >
                                  <RefreshCw
                                    size={14}
                                    strokeWidth={2}
                                    aria-hidden="true"
                                  />
                                  Swap
                                </button>
                              ) : null}
                            </div>
                          ) : null}
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </div>

              <aside className={styles.summary} aria-label="Bundle summary">
                <p className={styles.summaryCount}>
                  {selectionSummary}
                </p>
                {bundleEligible ? (
                  <dl className={styles.breakdown}>
                    <div>
                      <dt>Items</dt>
                      <dd>
                        {savings > 0.004 ? <del>{formatPrice(compareAt)}</del> : null}
                        {formatPrice(subtotal)}
                      </dd>
                    </div>
                    <div className={styles.breakdownDiscount}>
                      <dt>Bundle discount ({BUNDLE_DISCOUNT_PERCENT}%)</dt>
                      <dd>−{formatPrice(bundleDiscount)}</dd>
                    </div>
                  </dl>
                ) : null}
                <p className={styles.summaryTotal}>
                  <span>Bundle total</span>
                  <strong key={bundleTotal} className={styles.totalValue}>
                    {formatPrice(bundleTotal)}
                  </strong>
                </p>
                {totalSavings > 0.004 ? (
                  <p className={styles.summarySavings}>
                    You save {formatPrice(totalSavings)}
                    {bundleEligible ? " with this bundle" : ""}
                  </p>
                ) : null}
                {selectedItems.length > 0 && itemsNeededForBundle > 0 ? (
                  <p className={styles.unlockHint}>
                    Add {itemsNeededForBundle} more{" "}
                    {itemsNeededForBundle === 1 ? "item" : "items"} to get{" "}
                    {BUNDLE_DISCOUNT_PERCENT}% off the bundle.
                  </p>
                ) : null}

                {/* Free-shipping progress only while the admin offers it. */}
                {freeShipping.enabled ? (
                <div className={styles.shipping}>
                  <p className={styles.shippingText}>
                    <i
                      className="fa-regular fa-truck-fast"
                      aria-hidden="true"
                    />
                    {alreadyFree && projectedFree ? (
                      <span>Your order ships free.</span>
                    ) : bundleUnlocksFree ? (
                      <span>
                        <strong>This bundle unlocks free shipping.</strong>
                      </span>
                    ) : alreadyFree ? (
                      <span>
                        After this bundle discount, add {amountToFree} more for free shipping.
                      </span>
                    ) : toAdd.length ? (
                      <span>
                        With this bundle, you&apos;re {amountToFree} away from
                        free shipping.
                      </span>
                    ) : (
                      <span>
                        You&apos;re {amountToFree} away from free shipping.
                      </span>
                    )}
                  </p>
                  <div
                    className={styles.shippingBar}
                    role="progressbar"
                    aria-label="Free shipping progress"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={Math.floor(shippingProgress)}
                  >
                    <span style={{ width: `${shippingProgress}%` }} />
                  </div>
                </div>
                ) : null}

                <div className={styles.actions}>
                  {allInCart && (!bundleEligible || bundledInCart) ? (
                    <button
                      type="button"
                      className="rbt-btn rbt-btn-md w-100"
                      onClick={() => openSpecificBsModal("cartSidebar")}
                    >
                      <i
                        className="fa-solid fa-check mr--4"
                        aria-hidden="true"
                      />
                      View cart
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="rbt-btn rbt-btn-md w-100"
                      onClick={handleAddToCart}
                      disabled={!toAdd.length && !bundleEligible}
                    >
                      <i
                        className="fa-regular fa-cart-shopping mr--4"
                        aria-hidden="true"
                      />
                      {addLabel}
                      {bundleEligible && bundleDiscount > 0.004 ? (
                        <span className={styles.btnSave}>
                          Save {formatPrice(bundleDiscount)} as a bundle
                        </span>
                      ) : null}
                    </button>
                  )}
                  <button
                    type="button"
                    className="rbt-btn rbt-btn-md rbt-btn-border w-100"
                    onClick={handleSave}
                    disabled={!toSave.length}
                  >
                    <i
                      className={`${allSaved ? "fa-solid" : "fa-regular"} fa-heart mr--4`}
                      aria-hidden="true"
                    />
                    {allSaved ? "Saved to wishlist" : "Save to wishlist"}
                  </button>
                </div>

                <p className={styles.status} role="status" aria-live="polite">
                  {status}
                </p>
              </aside>
            </div>
          </DataBoundary>
        </div>
      </div>
    </section>
  );
}
