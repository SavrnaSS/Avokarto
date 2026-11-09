"use client";
import OfferBadge from "@/components/common/ui/OfferBadge";
import ProductRating from "@/components/common/ui/ProductRating";

import { useEffect, useMemo, useState } from "react";
import type { Swiper as SwiperClass } from "swiper";
import { Navigation } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import Image from "next/image";
import Link from "next/link";
import ColorVariantSwitcher from "@/components/product-details/productOptionsPanels/ColorVariantSwitcher";
import QuantitySelect from "@/components/common/ui/QuantitySelect";
import { useCartQuantityAction } from "@/hooks/useCartQuantityAction";
import { useLiveProducts } from "@/hooks/use-live-products";
import type { FrameSlide, Product } from "@/types";
import styles from "./SingleProduct.module.css";
import DataBoundary from "@/components/common/loading/DataBoundary";
import { useTranslation } from "@/lib/i18n/translations";
import { useCurrency } from "@/lib/currency";

export default function SingleProduct() {
  const { products, loading, error, hasData, refresh } = useLiveProducts({
    limit: 1,
  });
  return (
    <div className="rbt-section-gapTop"><div className="container">
      <DataBoundary loading={loading} error={error} ready={hasData} onRetry={refresh}
        layout="detail" count={2} label="Loading featured product" empty={!products.length}
        emptyMessage="No featured product is available yet.">
        {products[0] && <FeaturedProduct key={products[0].id} product={products[0]} />}
      </DataBoundary>
    </div></div>
  );
}

function FeaturedProduct({ product }: { product: Product }) {
  // Same dedup pattern as the real product page's gallery (DetailsFashion) -
  // prefers the full gallery so a selected color variant's image is likely
  // already present to slide to, instead of just the 2-image card preview.
  const slides = useMemo<FrameSlide[]>(
    () =>
      [
            { src: product.imgSrc },
            ...(product.variants?.map((variant) => ({ src: variant.src })) ?? []),
            ...(product.hoverImgSrc ? [{ src: product.hoverImgSrc }] : []),
          ].filter(
            (slide, index, all): slide is { src: string } =>
              Boolean(slide.src) &&
              all.findIndex((other) => other.src === slide.src) === index,
          ),
    [product.imgSrc, product.variants, product.hoverImgSrc],
  );
  const { quantity, setQuantity, buttonLabel, isDisabled, applyCartAction } =
    useCartQuantityAction(product);
  const { t } = useTranslation();
  const { formatPrice } = useCurrency();
  const [gallerySwiper, setGallerySwiper] = useState<SwiperClass | null>(null);
  const [selectedColorImage, setSelectedColorImage] = useState<string>();

  useEffect(() => {
    // A fresh product (the live feed picked up a different "latest" item)
    // shouldn't carry over the previous product's color selection.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedColorImage(undefined);
  }, [product.id]);

  useEffect(() => {
    if (!gallerySwiper || !selectedColorImage) return;

    const index = slides.findIndex((slide) => slide.src === selectedColorImage);
    if (index >= 0) {
      // slideToLoop (not slideTo) - this carousel runs loop:true, which
      // duplicates slides internally, so a plain index no longer maps to
      // the intended real slide.
      gallerySwiper.slideToLoop(index);
    }
  }, [gallerySwiper, selectedColorImage, slides]);
  return (
    <div
      id="rbt-product-block-02"
      className="rbt-single-product-area rbt-bg-color-white"
    >
      <div>
        <div className="row">
          <div className="col-lg-12">
            <div className="rbt-component-section-title text-center border-0 p-0">
              <h2 className="rbt-title rbt-scroll-trigger fade_in animation-order-1">
                <span className="rbt-bold--text">Item </span>Of The Week
              </h2>
            </div>
          </div>
        </div>
        <div className="row row--12 align-items-center">
          <div className="col-xl-8 col-12">
            <div className={styles.gallery}>
            <Swiper
              className="swiper prd-single-slide-activation-1 rbt-arrow-between"
              {...{
                slidesPerView: 1,
                grabCursor: true,
                speed: 500,
                spaceBetween: 24,
                loop: true,
                navigation: {
                  prevEl: ".fashion-single-prev",
                  nextEl: ".fashion-single-next",
                },
                // The image column stays full-width until xl (matching the
                // real product page's own gallery/content split) - showing
                // 2 slides any earlier than that means two full-bleed
                // portrait-framed (3:4) images fighting for the same row,
                // which balloons well past viewport height on tablet.
                breakpoints: {
                  1200: { slidesPerView: 2 },
                },
              }}
              modules={[Navigation]}
              onSwiper={setGallerySwiper}
            >
              {slides.map((slide, index) => (
                <SwiperSlide className="swiper-slide" key={index}>
                  <div
                    className={`thumbnail rbt-scroll-trigger zoom_in animation-order-${
                      index + 1
                    } ${styles.imageFrame}`}
                  >
                    {slide.src ? (
                      <Image
                        className="rbt-rounded--16 rbt-prd-img"
                        alt="Product Images"
                        src={slide.src}
                        fill
                        sizes="(max-width: 767px) 50vw, 25vw"
                      />
                    ) : null}
                    {slide.badges?.map((badge, idx) => (
                      <div
                        key={idx}
                        className={`rbt-product-badge ${badge.className} rbt-badge-top-left--position`}
                      >
                        {badge.text}
                      </div>
                    ))}
                  </div>
                </SwiperSlide>
              ))}
              <div className="rbt-swiper-arrow rbt-arrow-left fashion-single-prev">
                <div className="custom-overflow">
                  <i className="rbt-icon fa-regular fa-arrow-left" />
                  <i className="rbt-icon-top fa-regular fa-arrow-left" />
                </div>
              </div>
              <div className="rbt-swiper-arrow rbt-arrow-right fashion-single-next">
                <div className="custom-overflow">
                  <i className="rbt-icon fa-regular fa-arrow-right" />
                  <i className="rbt-icon-top fa-regular fa-arrow-right" />
                </div>
              </div>
            </Swiper>
            </div>
          </div>
          <div className="col-xl-4 col-12">
            <div className="content rbt-scroll-trigger fade_in animation-order-1">
              <Link
                href="/shop-by-category"
                className="rbt-card-subtitle rbt-card-categories-text mt--0 mt_sm--8 mt_md--8"
              >
                {product.category?.[0] ?? "Fashion"}
              </Link>
              <h2 className="rbt-card-title">
                <Link href={`/product/${product.slug ?? product.id}`}>
                  {product.title}
                </Link>
              </h2>
              {product.description ? (
                <p
                  className="description-text b1"
                  style={{ whiteSpace: "pre-line" }}
                >
                  {product.description}
                </p>
              ) : null}
              <div className="rbt-info-wrapper d-flex flex-wrap">
                <ProductRating product={product} className="mt--0"><span className="icon">
                    <i className="fa-sharp fa-solid fa-truck-fast" />
                  </span></ProductRating>
                {product.inStock !== false ? (
                  <div className="prd-info-section has-left-separator">
                    <div className="rbt-badge rbt-badge-bg-green rbt-badge-border rbt-badge-small rbt-badge-rounded">
                      {typeof product.availableQuantity === "number"
                        ? `${product.availableQuantity} ${t("in Stock")}`
                        : t("In Stock")}
                    </div>
                  </div>
                ) : null}
              </div>
              <div className="rbt-info-wrapper d-flex rbt-gap--8">
                <div className="pricing-part mt--0">
                  {product.oldPrice ? (
                    <del className="price-text">
                      {formatPrice(product.oldPrice)}
                    </del>
                  ) : null}
                  <span className="price-text">
                    {" "}
                    {formatPrice(product.price)}
                  </span>
                  <OfferBadge product={product} variant="minus" />
                </div>
                {product.filterBrands?.[0] ? (
                  <div className="prd-info-section">
                    <div className="prd-id-text">
                      <p className="text-bold">Brand:</p>
                      <Link
                        href="/shop-by-brands"
                        className="rbt-text-color-heading text-bold"
                      >
                        {product.filterBrands[0]}
                      </Link>
                    </div>
                  </div>
                ) : null}
              </div>
              <hr className="separator-top has-sm-spacer mt--16 mb--24" />
              <ColorVariantSwitcher
                colorVariants={product.colorVariants ?? []}
                onSelect={setSelectedColorImage}
              />
            </div>
            <div className="product-btn-grp">
              <div className="rbt-qty-area">
                <QuantitySelect
                  quantity={quantity}
                  setQuantity={setQuantity}
                />
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  applyCartAction();
                }}
                className="rbt-btn has-left-icon d-block text-center"
                disabled={isDisabled}
                suppressHydrationWarning
              >
                <i className="fa-regular fa-cart-shopping" />{" "}
                {buttonLabel}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
