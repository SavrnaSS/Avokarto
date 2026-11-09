"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  AlertCircle,
  Check,
  Heart,
  ImageOff,
  Link2,
  RefreshCw,
  Share2,
  ShoppingCart,
  TrendingDown,
  X,
} from "lucide-react";
import { useContextElement } from "@/context/Context";
import { useUiElement } from "@/context/uiStore";
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";
import {
  canBuyWishlistRow as canBuy,
  useWishlistRows,
  wishlistItemCount as itemCount,
  type WishlistRow as Row,
} from "@/hooks/use-wishlist-rows";
import { useCurrency } from "@/lib/currency";
import {
  getProductDetailsHref,
  withProductDetailsPageUrl,
} from "@/lib/productLinks";
import type { Product } from "@/types";
import styles from "./Wishlist.module.css";

// Rendered width of the thumbnail: 88px on phones, 112px wider (see CSS).
const THUMB_SIZES = "(max-width: 575px) 88px, 112px";

function Thumb({ product }: { product: Product }) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  if (!product.imgSrc || failedSrc === product.imgSrc) {
    return (
      <span className={styles.thumbFallback} role="img" aria-label={product.title}>
        <ImageOff size={22} strokeWidth={1.6} aria-hidden="true" />
      </span>
    );
  }
  return (
    <Image
      src={product.imgSrc}
      alt={product.title}
      fill
      sizes={THUMB_SIZES}
      onError={() => setFailedSrc(product.imgSrc)}
    />
  );
}

export default function Wishlist({
  sharedIds,
}: {
  // Catalog ids from a shared link (/wishlist?items=...). When present the
  // page shows that list read-only instead of the visitor's own wishlist.
  sharedIds?: string[];
}) {
  const {
    removeFromWishlist,
    addToWishlist,
    isAddedtoWishlist,
    addProductToCart,
    isAddedToCartProducts,
  } = useContextElement();
  const { openSpecificBsModal, showCartToaster } = useUiElement();
  const { formatPrice } = useCurrency();
  const { copied, copy } = useCopyToClipboard();

  const { rows, live, isShared, mounted } = useWishlistRows({ sharedIds });

  const buyable = rows.filter(canBuy);
  const toAdd = buyable.filter((row) => !isAddedToCartProducts(row.product.id));
  const toSave = rows.filter(
    (row) => row.availability !== "unavailable" && !isAddedtoWishlist(row.product.id),
  );
  const total = buyable.reduce((sum, row) => sum + row.product.price, 0);
  // Stock is still being confirmed for some rows - hold bulk actions until
  // it is rather than showing a misleading "All in cart".
  const checking = rows.some((row) => row.availability === "checking");

  // ---- sharing ----
  const [origin, setOrigin] = useState("");
  const [canNativeShare, setCanNativeShare] = useState(false);
  useEffect(() => {
    // Client-only values; set after mount so SSR and hydration agree.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOrigin(window.location.origin);
    setCanNativeShare(typeof navigator.share === "function");
  }, []);
  const shareIds = rows
    .filter((row) => row.availability !== "unavailable" && row.product.catalogId)
    .map((row) => row.product.catalogId as string);
  const shareUrl =
    origin && shareIds.length ? `${origin}/wishlist?items=${shareIds.join(",")}` : "";
  const shareText = "Take a look at my Avokarto wishlist";
  const shareTargets = shareUrl
    ? [
        {
          name: "WhatsApp",
          icon: "fa-brands fa-whatsapp",
          href: `https://wa.me/?text=${encodeURIComponent(`${shareText}: ${shareUrl}`)}`,
        },
        {
          name: "X",
          icon: "fa-brands fa-twitter",
          href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
        },
        {
          name: "Facebook",
          icon: "fa-brands fa-facebook",
          href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
        },
        {
          name: "Telegram",
          icon: "fa-brands fa-telegram",
          href: `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`,
        },
      ]
    : [];

  // ---- actions ----
  const [status, setStatus] = useState("");

  const addOne = (row: Row) => {
    if (!canBuy(row) || isAddedToCartProducts(row.product.id)) return;
    addProductToCart(withProductDetailsPageUrl(row.product));
    showCartToaster();
    setStatus(`${row.product.title} added to your cart.`);
  };

  const addAll = () => {
    if (!toAdd.length) return;
    toAdd.forEach((row) => addProductToCart(withProductDetailsPageUrl(row.product)));
    setStatus(`${itemCount(toAdd.length)} added to your cart.`);
    openSpecificBsModal("cartSidebar");
  };

  const remove = (row: Row) => {
    if (!row.saved) return;
    removeFromWishlist(row.saved.id);
    setStatus(`${row.product.title} removed from your wishlist.`);
  };

  const saveOne = (row: Row) => {
    // addToWishlist toggles - only call it for items not saved yet.
    if (isAddedtoWishlist(row.product.id)) return;
    addToWishlist(withProductDetailsPageUrl(row.product));
    setStatus(`${row.product.title} saved to your wishlist.`);
  };

  const saveAll = () => {
    toSave.forEach((row) => addToWishlist(withProductDetailsPageUrl(row.product)));
    setStatus(`${itemCount(toSave.length)} saved to your wishlist.`);
  };

  const nativeShare = async () => {
    try {
      await navigator.share({ title: "My Avokarto wishlist", text: shareText, url: shareUrl });
    } catch {
      // Dismissed by the shopper - nothing to do.
    }
  };

  // ---- render ----
  const waitingForShared = isShared && live.loading && !rows.length;
  const sharedAllGone = isShared && !live.loading && !rows.length;
  const ownEmpty = !isShared && mounted && rows.length === 0;

  const availabilityLabel = (row: Row) => {
    switch (row.availability) {
      case "in-stock":
        return <span className={`${styles.pill} ${styles.pillOk}`}>In stock</span>;
      case "low":
        return (
          <span className={`${styles.pill} ${styles.pillWarn}`}>
            Only {row.product.availableQuantity} left
          </span>
        );
      case "out":
        return <span className={`${styles.pill} ${styles.pillMuted}`}>Out of stock</span>;
      case "unavailable":
        return (
          <span className={`${styles.pill} ${styles.pillMuted}`}>No longer available</span>
        );
      case "checking":
        return <span className={styles.checking}>Checking availability…</span>;
      default:
        return null;
    }
  };

  return (
    <div className="rbt-component-area rbt-section-gap2Bottom">
      <div className="container">
        <div className={styles.wrap}>
          <header className={styles.head}>
            <div>
              <h2 className={styles.title}>
                {isShared ? "Shared wishlist" : "Your wishlist"}
                {rows.length ? (
                  <span className={styles.count}>{itemCount(rows.length)}</span>
                ) : null}
              </h2>
              <p className={styles.subtitle}>
                {isShared
                  ? "Someone shared these picks with you. Add them to your cart or save them to your own wishlist."
                  : "Everything you've saved, with live prices and stock. Add to cart whenever you're ready."}
              </p>
            </div>

            {rows.length ? (
              <div className={styles.toolbar}>
                {buyable.length ? (
                  <p className={styles.total}>
                    <span>{isShared ? "Total" : "Wishlist total"}</span>
                    <strong>{formatPrice(total)}</strong>
                  </p>
                ) : null}
                {isShared ? (
                  <button
                    type="button"
                    className="rbt-btn rbt-btn-sm rbt-btn-border"
                    onClick={saveAll}
                    disabled={!toSave.length}
                  >
                    <Heart size={15} aria-hidden="true" className={styles.btnIcon} />
                    {toSave.length ? "Save all to my wishlist" : "All saved"}
                  </button>
                ) : null}
                <button
                  type="button"
                  className="rbt-btn rbt-btn-sm"
                  onClick={addAll}
                  disabled={checking || !toAdd.length}
                >
                  <ShoppingCart size={15} aria-hidden="true" className={styles.btnIcon} />
                  {checking
                    ? "Add all to cart"
                    : toAdd.length
                      ? `Add ${toAdd.length === buyable.length ? "all" : toAdd.length} to cart`
                      : buyable.length
                        ? "All in cart"
                        : "Nothing in stock"}
                </button>
              </div>
            ) : null}
          </header>

          {live.error && rows.length ? (
            <div className={styles.notice} role="status">
              <AlertCircle size={16} aria-hidden="true" />
              <span>
                We couldn&apos;t refresh prices and stock just now
                {isShared ? "." : " - showing the details you saved."}
              </span>
              <button type="button" className={styles.noticeBtn} onClick={live.refresh}>
                <RefreshCw size={14} aria-hidden="true" /> Retry
              </button>
            </div>
          ) : null}

          {!mounted && !isShared ? (
            <div className={styles.skeletonList} aria-busy="true" aria-label="Loading wishlist">
              {[0, 1, 2].map((index) => (
                <div key={index} className={styles.skeletonRow} />
              ))}
            </div>
          ) : waitingForShared ? (
            <div className={styles.skeletonList} aria-busy="true" aria-label="Loading shared wishlist">
              {sharedIds!.slice(0, 3).map((id) => (
                <div key={id} className={styles.skeletonRow} />
              ))}
            </div>
          ) : ownEmpty || sharedAllGone ? (
            <div className={styles.empty}>
              <span className={styles.emptyIcon} aria-hidden="true">
                <Heart size={28} strokeWidth={1.8} />
              </span>
              <h3 className={styles.emptyTitle}>
                {sharedAllGone ? "These items are no longer available" : "Your wishlist is empty"}
              </h3>
              <p className={styles.emptyText}>
                {sharedAllGone
                  ? "The products in this shared list have been removed from the store."
                  : "Tap the heart on any product to save it here for later."}
              </p>
              <Link href="/shop" className="rbt-btn rbt-btn-sm">
                Browse products
              </Link>
            </div>
          ) : (
            <ul className={styles.list}>
              {rows.map((row) => {
                const { product } = row;
                const href = getProductDetailsHref(product);
                const inCart = isAddedToCartProducts(product.id);
                const buyableRow = canBuy(row);
                const savedHere = isAddedtoWishlist(product.id);
                const unavailable = row.availability === "unavailable";

                return (
                  <li
                    key={row.key}
                    className={`${styles.item} ${unavailable ? styles.itemUnavailable : ""}`}
                  >
                    {unavailable ? (
                      <span className={styles.thumb}>
                        <Thumb product={product} />
                      </span>
                    ) : (
                      <Link href={href} className={styles.thumb} aria-label={product.title}>
                        <Thumb product={product} />
                      </Link>
                    )}

                    <div className={styles.info}>
                      <h3 className={styles.name}>
                        {unavailable ? product.title : <Link href={href}>{product.title}</Link>}
                      </h3>
                      <div className={styles.priceRow}>
                        <span className={styles.price}>{formatPrice(product.price)}</span>
                        {product.oldPrice && product.oldPrice > product.price ? (
                          <del className={styles.oldPrice}>{formatPrice(product.oldPrice)}</del>
                        ) : null}
                        {row.priceDrop ? (
                          <span className={styles.drop}>
                            <TrendingDown size={13} aria-hidden="true" />
                            Price dropped {formatPrice(row.priceDrop)} since you saved it
                          </span>
                        ) : null}
                      </div>
                      <div className={styles.meta}>
                        {availabilityLabel(row)}
                        {product.sku && !unavailable ? (
                          <span className={styles.sku}>SKU {product.sku}</span>
                        ) : null}
                      </div>
                    </div>

                    <div className={styles.actions}>
                      {unavailable ? null : inCart ? (
                        <button
                          type="button"
                          className="rbt-btn rbt-btn-sm rbt-btn-border"
                          onClick={() => openSpecificBsModal("cartSidebar")}
                        >
                          <Check size={15} aria-hidden="true" className={styles.btnIcon} />
                          In cart
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="rbt-btn rbt-btn-sm"
                          onClick={() => addOne(row)}
                          disabled={!buyableRow}
                        >
                          <ShoppingCart size={15} aria-hidden="true" className={styles.btnIcon} />
                          {row.availability === "out" ? "Out of stock" : "Add to cart"}
                        </button>
                      )}

                      {isShared ? (
                        <button
                          type="button"
                          className={styles.iconBtn}
                          onClick={() => saveOne(row)}
                          disabled={savedHere || unavailable}
                          aria-label={
                            savedHere
                              ? `${product.title} is in your wishlist`
                              : `Save ${product.title} to your wishlist`
                          }
                          title={savedHere ? "In your wishlist" : "Save to my wishlist"}
                        >
                          <Heart
                            size={17}
                            aria-hidden="true"
                            fill={savedHere ? "currentColor" : "none"}
                          />
                        </button>
                      ) : (
                        <button
                          type="button"
                          className={styles.iconBtn}
                          onClick={() => remove(row)}
                          aria-label={`Remove ${product.title} from your wishlist`}
                          title="Remove"
                        >
                          <X size={17} aria-hidden="true" />
                          <span className={styles.iconBtnText}>Remove</span>
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          {!isShared && shareUrl ? (
            <section className={styles.share} aria-labelledby="wishlist-share-title">
              <div>
                <h3 id="wishlist-share-title" className={styles.shareTitle}>
                  Share your wishlist
                </h3>
                <p className={styles.shareText}>
                  Anyone with the link can see these items - handy for gift ideas.
                </p>
              </div>
              <div className={styles.shareActions}>
                <button
                  type="button"
                  className="rbt-btn rbt-btn-sm rbt-btn-border"
                  onClick={() => {
                    copy(shareUrl);
                    setStatus("Wishlist link copied.");
                  }}
                >
                  {copied ? (
                    <Check size={15} aria-hidden="true" className={styles.btnIcon} />
                  ) : (
                    <Link2 size={15} aria-hidden="true" className={styles.btnIcon} />
                  )}
                  {copied ? "Link copied" : "Copy link"}
                </button>
                {canNativeShare ? (
                  <button type="button" className="rbt-btn rbt-btn-sm" onClick={nativeShare}>
                    <Share2 size={15} aria-hidden="true" className={styles.btnIcon} />
                    Share
                  </button>
                ) : null}
                <ul className={styles.socials}>
                  {shareTargets.map((target) => (
                    <li key={target.name}>
                      <a
                        href={target.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Share on ${target.name}`}
                        title={`Share on ${target.name}`}
                      >
                        <i className={target.icon} aria-hidden="true" />
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          ) : null}

          {isShared ? (
            <p className={styles.backLink}>
              <Link href="/wishlist">Go to your own wishlist</Link>
            </p>
          ) : null}

          <p className={styles.srOnly} role="status" aria-live="polite">
            {status}
          </p>
        </div>
      </div>
    </div>
  );
}
