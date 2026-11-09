"use client";

import Image from "next/image";
import Link from "next/link";
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  ImageOff,
  LoaderCircle,
  RefreshCw,
  Share2,
  ShoppingBag,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import ModalTriggerButton from "@/components/action-buttons/ModalTriggerButton";
import CompareQuickLinkTrigger from "@/components/action-buttons/CompareQuickLinkTrigger";
import WishlistQuickLinkTrigger from "@/components/action-buttons/WishlistQuickLinkTrigger";
import OfferBadge from "@/components/common/ui/OfferBadge";
import ProductRating from "@/components/common/ui/ProductRating";
import QuantitySelect from "@/components/common/ui/QuantitySelect";
import { useContextElement, useUiElement } from "@/context/Context";
import { useLiveProduct } from "@/hooks/use-live-product";
import { useCartQuantityAction } from "@/hooks/useCartQuantityAction";
import { useManagedModalPanel } from "@/hooks/useManagedModalPanel";
import { useCurrency } from "@/lib/currency";
import { getProductDetailsHref } from "@/lib/productLinks";
import type { Product } from "@/types/product";
import styles from "./QuickView2.module.css";

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

function productImages(product: Product) {
  return [
    product.imgSrc,
    ...(product.variants?.map((variant) => variant.src) ?? []),
    ...(product.frameSlides?.map((slide) => slide.src ?? slide.imgSrc) ?? []),
    ...(product.hoverImgSrc ? [product.hoverImgSrc] : []),
    ...(product.colorVariants?.map((variant) => variant.src) ?? []),
  ].filter(
    (src, index, images): src is string =>
      Boolean(src?.trim()) && images.indexOf(src) === index,
  );
}

type QuickViewContentProps = {
  product: Product;
  error: string | null;
  hasData: boolean;
  isLive: boolean;
  loading: boolean;
  refreshing: boolean;
  refresh: () => void;
  close: () => void;
};

function QuickViewContent({
  product,
  error,
  hasData,
  isLive,
  loading,
  refreshing,
  refresh,
  close,
}: QuickViewContentProps) {
  const { formatPrice } = useCurrency();
  const { setSocialSharePath } = useUiElement();
  const [activeImage, setActiveImage] = useState(0);
  const images = useMemo(() => productImages(product), [product]);
  const imageIndex = images.length
    ? Math.min(activeImage, images.length - 1)
    : 0;
  const imageSrc = images[imageIndex];
  const productDetailHref = getProductDetailsHref(product);
  const productCategory = product.category?.[0] ?? product.filterCategory?.[0];
  const description = product.shortSummary?.trim() || product.description?.trim();
  const brand = product.brand?.trim() || product.filterBrands?.[0]?.trim();
  const hasStockCount = Number.isFinite(product.availableQuantity);
  const stockCount = hasStockCount
    ? Math.max(0, Math.trunc(product.availableQuantity ?? 0))
    : null;
  const inStock =
    product.inStock !== false &&
    !product.isStockOut &&
    (stockCount === null || stockCount > 0);
  const validProduct = Boolean(product.id && product.title);
  const liveVerified = !isLive || (hasData && !error);
  const canPurchase = validProduct && inStock && liveVerified && !loading;
  const maxQuantity = stockCount === null ? undefined : Math.max(1, stockCount);
  const { quantity, setQuantity, buttonLabel, isDisabled, applyCartAction,
    buyNow: startCheckout, isBuyNowDisabled, isBuyingNow } =
    useCartQuantityAction(product, undefined, maxQuantity);

  const addButtonLabel = loading
    ? "Checking stock"
    : !inStock
      ? "Out of stock"
      : error
        ? "Availability unavailable"
        : buttonLabel;

  const selectPreviousImage = () => {
    if (images.length < 2) return;
    setActiveImage((current) =>
      (Math.min(current, images.length - 1) - 1 + images.length) % images.length,
    );
  };

  const selectNextImage = () => {
    if (images.length < 2) return;
    setActiveImage((current) =>
      (Math.min(current, images.length - 1) + 1) % images.length,
    );
  };

  const buyNow = () => {
    if (!canPurchase) return;
    if (startCheckout()) close();
  };

  if (!validProduct) {
    return (
      <div className={styles.emptyState} role="status">
        <ImageOff aria-hidden="true" size={36} strokeWidth={1.7} />
        <h2 id="quickViewModalLabel">Product unavailable</h2>
        <p>This item could not be opened. Close this window and try again.</p>
      </div>
    );
  }

  return (
    <div className={styles.body} aria-busy={loading || refreshing}>
      <section className={styles.media} aria-label={`${product.title} gallery`}>
        <div className={styles.galleryStage}>
          {imageSrc ? (
            <Image
              key={imageSrc}
              src={imageSrc}
              alt={`${product.title}, view ${imageIndex + 1} of ${images.length}`}
              fill
              sizes="(max-width: 991px) calc(100vw - 40px), 54vw"
              className={styles.mainImage}
            />
          ) : (
            <div className={styles.imageFallback}>
              <ImageOff aria-hidden="true" size={34} strokeWidth={1.6} />
              <span>Image unavailable</span>
            </div>
          )}

          {images.length > 1 ? (
            <>
              <button
                type="button"
                className={`${styles.galleryArrow} ${styles.galleryArrowPrevious}`}
                aria-label="Previous product image"
                onClick={selectPreviousImage}
              >
                <ChevronLeft aria-hidden="true" size={24} />
              </button>
              <button
                type="button"
                className={`${styles.galleryArrow} ${styles.galleryArrowNext}`}
                aria-label="Next product image"
                onClick={selectNextImage}
              >
                <ChevronRight aria-hidden="true" size={24} />
              </button>
            </>
          ) : null}

          {isLive && (loading || refreshing) ? (
            <div className={styles.mediaStatus} role="status" aria-live="polite">
              <LoaderCircle aria-hidden="true" size={15} className={styles.spin} />
              {loading ? "Checking live details" : "Updating"}
            </div>
          ) : null}
        </div>

        {images.length > 1 ? (
          <div className={styles.thumbnailRail} aria-label="Choose product image">
            {images.map((src, index) => (
              <button
                type="button"
                key={src}
                className={`${styles.thumbnailButton} ${index === imageIndex ? styles.thumbnailActive : ""}`}
                aria-label={`Show image ${index + 1} of ${images.length}`}
                aria-current={index === imageIndex ? "true" : undefined}
                onClick={() => setActiveImage(index)}
              >
                <Image
                  src={src}
                  alt=""
                  fill
                  sizes="72px"
                  className={styles.thumbnailImage}
                />
              </button>
            ))}
          </div>
        ) : null}
      </section>

      <section className={styles.details}>
        {productCategory ? (
          <Link
            href="/shop-by-category"
            className={styles.category}
            onClick={close}
          >
            {productCategory}
          </Link>
        ) : null}

        <h2 className={styles.productTitle} id="quickViewModalLabel">
          {product.title}
        </h2>

        <ProductRating product={product} className={styles.rating} />

        {description ? (
          <p className={styles.description} id="quickViewDescription">
            {description}
          </p>
        ) : null}

        <div className={styles.priceRow}>
          {product.oldPrice != null && product.oldPrice > product.price ? (
            <del>{formatPrice(product.oldPrice)}</del>
          ) : null}
          <strong>{formatPrice(product.price)}</strong>
          <OfferBadge product={product} variant="minus" />
        </div>

        <dl className={styles.metaList}>
          <div className={styles.metaItem}>
            <dt>Availability</dt>
            <dd
              className={
                !liveVerified || loading
                  ? styles.stockPending
                  : inStock
                    ? styles.inStock
                    : styles.outOfStock
              }
            >
              {loading && isLive
                ? "Checking"
                : !liveVerified
                  ? "Unverified"
                  : inStock
                    ? stockCount === null
                      ? "In stock"
                      : `${stockCount} in stock`
                    : "Out of stock"}
            </dd>
          </div>
          {product.sku ? (
            <div className={styles.metaItem}>
              <dt>SKU</dt>
              <dd>{product.sku}</dd>
            </div>
          ) : null}
          {brand ? (
            <div className={styles.metaItem}>
              <dt>Brand</dt>
              <dd>{brand}</dd>
            </div>
          ) : null}
        </dl>

        {error && isLive ? (
          <div className={styles.errorNotice} role="alert">
            <AlertCircle aria-hidden="true" size={20} />
            <div>
              <strong>Live availability could not be confirmed.</strong>
              <span>Purchasing is paused until the product reconnects.</span>
            </div>
            <button type="button" onClick={refresh} className={styles.retryButton}>
              <RefreshCw aria-hidden="true" size={16} />
              Retry
            </button>
          </div>
        ) : null}

        {product.colorVariants?.length ? (
          <div className={styles.optionGroup}>
            <div className={styles.optionHeading}>
              <strong>Color preview</strong>
              <span>
                {product.colorVariants.find((variant) => variant.src === imageSrc)
                  ?.tooltip ?? "Choose a color"}
              </span>
            </div>
            <div className={styles.swatchList}>
              {product.colorVariants.map((variant) => {
                const selected = variant.src === imageSrc;
                const targetIndex = images.indexOf(variant.src);
                return (
                  <button
                    key={`${variant.src}-${variant.tooltip}`}
                    type="button"
                    className={`${styles.swatchButton} ${selected ? styles.swatchActive : ""}`}
                    aria-label={`Preview ${variant.tooltip}`}
                    aria-pressed={selected}
                    title={variant.tooltip}
                    onClick={() => {
                      if (targetIndex >= 0) setActiveImage(targetIndex);
                    }}
                  >
                    <span style={{ backgroundColor: variant.color }} />
                  </button>
                );
              })}
            </div>
          </div>
        ) : null}

        <div className={styles.purchaseArea}>
          <div className={styles.purchaseRow}>
            <div className={styles.quantity} aria-label="Product quantity">
              <QuantitySelect
                quantity={quantity}
                setQuantity={setQuantity}
                max={maxQuantity}
              />
            </div>
            <ModalTriggerButton
              className={styles.addButton}
              openModalName="popup-cartModal"
              disabled={!canPurchase || isDisabled}
              aria-disabled={!canPurchase || isDisabled}
              onClick={applyCartAction}
              suppressHydrationWarning
            >
              <ShoppingBag aria-hidden="true" size={19} />
              {addButtonLabel}
            </ModalTriggerButton>
          </div>

          <button
            type="button"
            className={styles.buyButton}
            disabled={!canPurchase || isBuyNowDisabled}
            aria-busy={isBuyingNow}
            onClick={buyNow}
          >
            Buy now
          </button>

          <Link
            href={productDetailHref}
            className={styles.detailsLink}
            onClick={close}
          >
            View full product details
            <ExternalLink aria-hidden="true" size={17} />
          </Link>
        </div>

        <div className={styles.utilityActions} aria-label="Product actions">
          <WishlistQuickLinkTrigger
            product={product}
            parentClass={styles.utilityButton}
          />
          <CompareQuickLinkTrigger
            product={product}
            parentClass={styles.utilityButton}
          />
          <ModalTriggerButton
            className={styles.utilityButton}
            openModalName="socialShareModal"
            type="button"
            onClick={() => setSocialSharePath(productDetailHref)}
          >
            <Share2 aria-hidden="true" size={17} />
            Share
          </ModalTriggerButton>
        </div>
      </section>
    </div>
  );
}

export default function QuickView2() {
  const { quickViewItem } = useContextElement();
  const { close, isOpen, activeBsModal } =
    useManagedModalPanel("quickViewModal");
  const liveProduct = useLiveProduct(quickViewItem);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);
  const isTopModal =
    isOpen && activeBsModal[activeBsModal.length - 1] === "quickViewModal";

  useEffect(() => {
    if (!isOpen) return;
    openerRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    return () => {
      openerRef.current?.focus({ preventScroll: true });
      openerRef.current = null;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isTopModal) return;

    const focusFrame = window.requestAnimationFrame(() => {
      closeButtonRef.current?.focus({ preventScroll: true });
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
        return;
      }

      if (event.key !== "Tab" || !dialogRef.current) return;
      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      ).filter(
        (element) =>
          element.getClientRects().length > 0 &&
          element.getAttribute("aria-hidden") !== "true",
      );

      if (!focusable.length) {
        event.preventDefault();
        dialogRef.current.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [close, isTopModal]);

  const productKey = String(
    liveProduct.product.catalogId ?? liveProduct.product.id ?? "empty",
  );

  return (
    <div
      className={`rbt-default-modal modal fade ${styles.modal}`}
      id="quickViewModal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="quickViewModalLabel"
      aria-describedby={
        liveProduct.product.shortSummary?.trim() ||
        liveProduct.product.description?.trim()
          ? "quickViewDescription"
          : undefined
      }
      tabIndex={-1}
      ref={dialogRef}
    >
      <div className={`modal-dialog modal-dialog-centered ${styles.dialog}`}>
        <div className={`modal-content ${styles.content}`}>
          <header className={styles.header}>
            <div className={styles.headerTitle}>Quick view</div>
            <div className={styles.headerStatus} aria-live="polite">
              {liveProduct.isLive && liveProduct.hasData && !liveProduct.error ? (
                <>
                  <span className={styles.liveDot} aria-hidden="true" />
                  {liveProduct.refreshing ? "Updating inventory" : "Live inventory"}
                </>
              ) : null}
            </div>
            <button
              type="button"
              className={styles.closeButton}
              aria-label="Close quick view"
              onClick={close}
              ref={closeButtonRef}
            >
              <X aria-hidden="true" size={23} />
            </button>
          </header>

          <QuickViewContent
            key={productKey}
            product={liveProduct.product}
            error={liveProduct.error}
            hasData={liveProduct.hasData}
            isLive={liveProduct.isLive}
            loading={liveProduct.loading}
            refreshing={liveProduct.refreshing}
            refresh={liveProduct.refresh}
            close={close}
          />
        </div>
      </div>
    </div>
  );
}
