"use client";
import OfferBadge from "@/components/common/ui/OfferBadge";
import ProductRating from "@/components/common/ui/ProductRating";

import Image from "next/image";
import Link from "next/link";

import ProductActionPanel from "../ProductActionPanel";
import GuestRegistrationBanner from "../GuestRegistrationBanner";
import MobileGallerySlider from "../sliders/MobileGallerySlider";
import DesktopProductGallery from "../sliders/DesktopProductGallery";

import RecomendedProducts from "../recommandedProducts/RecomendedProducts";
import ProductSidebarAd from "../others/ProductSidebarAd";
import AdditionalOffers from "../others/AdditionalOffers";

import ColorVariantSwitcher from "../productOptionsPanels/ColorVariantSwitcher";

import { Product } from "@/types";
import { useLiveProduct } from "@/hooks/use-live-product";
import { recordProductView } from "@/hooks/use-recently-viewed";
import { parseProductSpecifications } from "@/lib/productSpecifications";
import { useCurrency } from "@/lib/currency";
import { useEffect, useState } from "react";
import styles from "./DetailsFashion.module.css";
import { isProductOutOfStock } from "@/lib/cartQuantity";
const FASHION_IMAGES = [
  "/assets/images/product-img/fashion/fashion-a-red-01.webp",
  "/assets/images/product-img/fashion/fashion-a-red-02.webp",
  "/assets/images/product-img/fashion/fashion-a-red-03.webp",
  "/assets/images/product-img/fashion/fashion-a-red-04.webp",
] as const;

export default function DetailsFashion({
  product: initialProduct,
}: {
  product: Product;
}) {
  const { product } = useLiveProduct(initialProduct);
  const productGalleryImages = [
    product.imgSrc,
    ...(product.variants?.map((variant) => variant.src) ?? []),
    ...(product.frameSlides?.map((slide) => slide.src ?? slide.imgSrc) ?? []),
  ].filter((src, index, images): src is string => {
    return Boolean(src) && images.indexOf(src) === index;
  });
  // FASHION_IMAGES is a fallback for the rare case a product has no usable
  // image at all - never padding for a real product that just has fewer
  // than 4 images, which used to make unrelated demo photos show up
  // alongside real product photos.
  const galleryImages = productGalleryImages.length
    ? productGalleryImages
    : FASHION_IMAGES;
  const primaryCategory = product.category?.[0] ?? "Shop";
  const viewId = product.catalogId ?? String(product.id);
  const isOutOfStock = isProductOutOfStock(product);
  const availableQuantity =
    typeof product.availableQuantity === "number"
      ? Math.max(0, Math.trunc(product.availableQuantity))
      : null;
  const [selectedColorImage, setSelectedColorImage] = useState<string>();
  const { formatPrice } = useCurrency();
  const specifications = parseProductSpecifications(product.specifications);

  useEffect(() => {
    recordProductView(viewId);
    // A fresh product (e.g. client-side nav to a different product page)
    // shouldn't carry over the previous product's color selection.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedColorImage(undefined);
  }, [viewId]);

  return (
    <div className="rbt-component-area rbt-single-product-area rbt-bg-color-white rbt-section-gapBottom">
      <div className="container">
        <div className="row row--12 mt_dec--24 justify-content-center">
          <div className="col-xl-9 col-lg-12 mt--24">
            <div className="row row--12 justify-content-center mt_dec--16">
              <div className="col-xl-6 col-lg-12 col-12 mt--16">
                <div className="rbt-single-product-media-area position-sticky-top rbt-single-product-media-area-dflt d-flex rbt-gap--24">
                  {product.badge?.text ? (
                    <div className="rbt-product-badge rbt-product-badge-bg-green rbt-badge-top-left--position">
                      {product.badge.text}
                    </div>
                  ) : null}
                  <div className="d-lg-none w-100">
                    <MobileGallerySlider
                      images={galleryImages}
                      alt={product.title}
                      imageAlts={product.imageAlts}
                      activeSrc={selectedColorImage}
                    />
                  </div>
                  <div className="d-none d-lg-block w-100">
                    <DesktopProductGallery
                      images={galleryImages}
                      alt={product.title}
                      imageAlts={product.imageAlts}
                      activeSrc={selectedColorImage}
                    />
                  </div>
                </div>
              </div>
              <div className="col-xl-6 col-lg-12 col-12 mt--16">
                <div className="rbt-single-product-content rbt-product-variations">
                  <GuestRegistrationBanner product={product} />
                  <Link
                    href={product.category?.[0]
                      ? `/shop?category=${encodeURIComponent(product.category[0])}`
                      : "/shop"}
                    className="rbt-card-subtitle rbt-card-categories-text"
                  >
                    {primaryCategory}
                  </Link>
                  <h1 className="h2 rbt-card-title mt--12">{product.title}</h1>
                  {product.description ? (
                    <p
                      className="description-text b2 mt--16"
                      style={{ whiteSpace: "pre-line" }}
                    >
                      {product.description}
                    </p>
                  ) : null}
                  <div className="rbt-info-wrapper d-flex mt--16">
                    <div className="rbt-store-price-1">
                      <div className="pricing-part mt--0">
                        {product.oldPrice && (
                          <del className="price-text">
                            {formatPrice(product.oldPrice)}
                          </del>
                        )}
                        <span className="price-text">
                          {" "}
                          {formatPrice(product.price)}
                        </span>
                        <OfferBadge
                          product={product}
                          className="rbt-offer-badge-md"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="rbt-info-wrapper d-flex mt--28">
                    <ProductRating product={product} className="mt--0" />
                  </div>
                  <ColorVariantSwitcher
                    colorVariants={product.colorVariants ?? []}
                    onSelect={setSelectedColorImage}
                  />

                  <div className="rbt-info-wrapper d-block mt--24">
                    <div className="rbt-prd-qty-area">
                      <p
                        className={
                          isOutOfStock
                            ? "prd-qty-txt rbt-text-color-danger"
                            : "prd-qty-txt"
                        }
                      >
                        <strong>
                          {isOutOfStock
                            ? "Out of stock"
                            : availableQuantity === null
                              ? "In stock"
                              : `${availableQuantity} in stock`}
                        </strong>
                      </p>
                    </div>
                  </div>
                  <ProductActionPanel product={product} />
                  <AdditionalOffers />
                  <hr className="rbt-separator rbt-separator-gray200 mt--24 mb--24" />
                  <div className="rbt-info-wrapper d-block mt--24">
                    <ul className="product-details-list shipment-details-list">
                      {specifications.map((spec) => (
                        <li key={spec.label}>
                          <span className="rbt-bold--text mr--4">
                            {spec.label} :
                          </span>
                          <span className="text">{spec.value}</span>
                        </li>
                      ))}
                      <li>
                        <span className="icon">
                          <i className="fa-sharp fa-regular fa-truck" />
                        </span>
                        <div className="right-content">
                          <span className="rbt-bold--text mr--4">Delivery :</span>
                          <span className="text">
                            View available shipping options at checkout.
                          </span>
                        </div>
                      </li>
                    </ul>
                  </div>
                  <div className="rbt-info-wrapper d-block mt--24">
                    <div className="rbt-info-box rbt-bg-color-brand-50">
                      <div className="rbt-payment-info-container">
                        <ul className="payment-img-link">
                          <li>
                            <Link href="/shop">
                              <Image
                                alt="Payment Brand Image"
                                src="/assets/images/payment-brand/image-01.webp"
                                width={812}
                                height={64}
                              />
                            </Link>
                          </li>
                        </ul>
                        <span className="b2 rbt-text-medium text-center rbt-text-color-heading mt--12 d-block">
                          Review your order and delivery details at checkout.
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div
            className={`col-xl-3 col-lg-12 mt--24 rbt-single-mobile-view-sidebar ${styles.sidebar}`}
          >
            <RecomendedProducts
              currentProduct={product}
              parentClass="rbt-tab rbt-product-single-details-tab rbt-fshape-tab rbt-product-single-details-tab-sm"
              detailsPageUrl="/product"
            />

            <ProductSidebarAd />
          </div>
        </div>
      </div>
    </div>
  );
}
