"use client";
import { CloseIcon } from "../svg-icons";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Check, Heart, ImageOff, ShoppingCart, TrendingDown, X } from "lucide-react";
import { useContextElement } from "@/context/Context";
import { useUiElement } from "@/context/uiStore";
import { useManagedModalPanel } from "@/hooks/useManagedModalPanel";
import {
  canBuyWishlistRow,
  useWishlistRows,
  wishlistItemCount,
  type WishlistRow,
} from "@/hooks/use-wishlist-rows";
import { useCurrency } from "@/lib/currency";
import {
  getProductDetailsHref,
  withProductDetailsPageUrl,
} from "@/lib/productLinks";
import type { Product } from "@/types";
import styles from "./WishList.module.css";

function Thumb({ product }: { product: Product }) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  if (!product.imgSrc || failedSrc === product.imgSrc) {
    return (
      <span className={styles.thumbFallback} role="img" aria-label={product.title}>
        <ImageOff size={18} strokeWidth={1.6} aria-hidden="true" />
      </span>
    );
  }
  return (
    <Image
      src={product.imgSrc}
      alt={product.title}
      fill
      sizes="72px"
      onError={() => setFailedSrc(product.imgSrc)}
    />
  );
}

function StockLabel({ row }: { row: WishlistRow }) {
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
      return <span className={`${styles.pill} ${styles.pillMuted}`}>No longer available</span>;
    case "checking":
      return <span className={styles.checking}>Checking stock…</span>;
    default:
      return null;
  }
}

export default function WishList() {
  const { removeFromWishlist, addProductToCart, isAddedToCartProducts } =
    useContextElement();
  const { openSpecificBsModal, showCartToaster } = useUiElement();
  const { isOpen, close } = useManagedModalPanel("wishlistModal");
  const { formatPrice } = useCurrency();
  // Live prices/stock only while the popup is open.
  const { rows, mounted } = useWishlistRows({ enabled: isOpen });
  const [status, setStatus] = useState("");

  const buyable = rows.filter(canBuyWishlistRow);
  const checking = rows.some((row) => row.availability === "checking");
  const toAdd = buyable.filter((row) => !isAddedToCartProducts(row.product.id));
  const total = buyable.reduce((sum, row) => sum + row.product.price, 0);

  const addOne = (row: WishlistRow) => {
    if (!canBuyWishlistRow(row) || isAddedToCartProducts(row.product.id)) return;
    addProductToCart(withProductDetailsPageUrl(row.product));
    showCartToaster();
    setStatus(`${row.product.title} added to your cart.`);
  };

  const addAll = () => {
    if (!toAdd.length) return;
    toAdd.forEach((row) => addProductToCart(withProductDetailsPageUrl(row.product)));
    close();
    openSpecificBsModal("cartSidebar");
  };

  const remove = (row: WishlistRow) => {
    if (!row.saved) return;
    removeFromWishlist(row.saved.id);
    setStatus(`${row.product.title} removed from your wishlist.`);
  };

  const viewCart = () => {
    close();
    openSpecificBsModal("cartSidebar");
  };

  return (
    <div
      className="rbt-default-modal modal fade has-rbt-top-folder-shape"
      id="wishlistModal"
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-labelledby="wishlistModalLabel"
    >
      <div className="modal-dialog xs-size modal-dialog-centered">
        <div className="modal-content">
          <div className="rbt-folder-shape-right-portion">
            <CloseIcon />
          </div>
          <div className="modal-header">
            <button
              type="button"
              className="rbt-round-btn rbt-modal-dis-btn"
              aria-label="Close wishlist"
              onClick={close}
            >
              <i className="fa-solid fa-xmark" />
            </button>
          </div>
          <div className="rbt-top-folder-shape-wrapper">
            <div className="rbt-bg-color-white rbt-content-trs-portion">
              <div className={styles.content}>
                <div className={styles.head}>
                  <h5 className={styles.title} id="wishlistModalLabel">
                    Your wishlist
                  </h5>
                  {rows.length ? (
                    <span className={styles.count}>{wishlistItemCount(rows.length)}</span>
                  ) : null}
                </div>

                {!mounted ? (
                  <div className={styles.skeleton} aria-busy="true" aria-label="Loading wishlist" />
                ) : rows.length === 0 ? (
                  <div className={styles.empty}>
                    <span className={styles.emptyIcon} aria-hidden="true">
                      <Heart size={24} strokeWidth={1.8} />
                    </span>
                    <p className={styles.emptyTitle}>Your wishlist is empty</p>
                    <p className={styles.emptyText}>
                      Tap the heart on any product to save it for later.
                    </p>
                    <Link href="/shop" className="rbt-btn rbt-btn-sm" onClick={close}>
                      Browse products
                    </Link>
                  </div>
                ) : (
                  <>
                    <ul className={styles.list}>
                      {rows.map((row) => {
                        const { product } = row;
                        const href = getProductDetailsHref(product);
                        const unavailable = row.availability === "unavailable";
                        const inCart = isAddedToCartProducts(product.id);
                        const buyableRow = canBuyWishlistRow(row);

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
                              <Link
                                href={href}
                                className={styles.thumb}
                                aria-label={product.title}
                                onClick={close}
                              >
                                <Thumb product={product} />
                              </Link>
                            )}

                            <div className={styles.info}>
                              <p className={styles.name}>
                                {unavailable ? (
                                  product.title
                                ) : (
                                  <Link href={href} onClick={close}>
                                    {product.title}
                                  </Link>
                                )}
                              </p>
                              <div className={styles.priceRow}>
                                <span className={styles.price}>{formatPrice(product.price)}</span>
                                {product.oldPrice && product.oldPrice > product.price ? (
                                  <del className={styles.oldPrice}>
                                    {formatPrice(product.oldPrice)}
                                  </del>
                                ) : null}
                              </div>
                              {row.priceDrop ? (
                                <span className={styles.drop}>
                                  <TrendingDown size={12} aria-hidden="true" />
                                  {formatPrice(row.priceDrop)} lower than when you saved it
                                </span>
                              ) : null}
                              <StockLabel row={row} />
                            </div>

                            <div className={styles.actions}>
                              {unavailable ? null : inCart ? (
                                <button
                                  type="button"
                                  className={`${styles.cartBtn} ${styles.cartBtnDone}`}
                                  onClick={viewCart}
                                  aria-label={`${product.title} is in your cart. View cart`}
                                >
                                  <Check size={15} aria-hidden="true" />
                                  <span className={styles.cartBtnText}>In cart</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  className={styles.cartBtn}
                                  onClick={() => addOne(row)}
                                  disabled={!buyableRow}
                                  aria-label={
                                    row.availability === "out"
                                      ? `${product.title} is out of stock`
                                      : `Add ${product.title} to cart`
                                  }
                                >
                                  <ShoppingCart size={15} aria-hidden="true" />
                                  <span className={styles.cartBtnText}>
                                    {row.availability === "out" ? "Sold out" : "Add"}
                                  </span>
                                </button>
                              )}
                              <button
                                type="button"
                                className={styles.removeBtn}
                                onClick={() => remove(row)}
                                aria-label={`Remove ${product.title} from your wishlist`}
                                title="Remove"
                              >
                                <X size={16} aria-hidden="true" />
                              </button>
                            </div>
                          </li>
                        );
                      })}
                    </ul>

                    <div className={styles.footer}>
                      {buyable.length ? (
                        <p className={styles.total}>
                          <span>Total</span>
                          <strong>{formatPrice(total)}</strong>
                        </p>
                      ) : null}
                      <div className={styles.footerActions}>
                        <Link
                          href="/wishlist"
                          className="rbt-btn rbt-btn-sm rbt-btn-border"
                          onClick={close}
                        >
                          View full wishlist
                        </Link>
                        <button
                          type="button"
                          className="rbt-btn rbt-btn-sm"
                          onClick={toAdd.length ? addAll : viewCart}
                          disabled={checking || (!toAdd.length && !buyable.length)}
                        >
                          {checking
                            ? "Add all to cart"
                            : toAdd.length
                              ? `Add ${toAdd.length === buyable.length ? "all" : toAdd.length} to cart`
                              : buyable.length
                                ? "View cart"
                                : "Nothing in stock"}
                        </button>
                      </div>
                    </div>
                  </>
                )}

                <Link href="/shop" className={styles.continue} onClick={close}>
                  Continue shopping
                </Link>

                <p className={styles.srOnly} role="status" aria-live="polite">
                  {status}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
