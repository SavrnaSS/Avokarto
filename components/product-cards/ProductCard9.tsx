"use client";
import OfferBadge from "@/components/common/ui/OfferBadge";

import Image from "next/image";
import Link from "next/link";
import AddToCart from "../action-buttons/AddToCart";
import Countdown from "../common/ui/Countdown";
import Facts from "../common/other-components/Facts";
import { Product } from "@/types";
import { useState } from "react";
import Tooltip from "@/components/common/ui/Tooltip";
import AddToCompareThree from "../action-buttons/AddToCompareThree";
import AddToWishlist from "../action-buttons/AddToWishlistOne";
import AddToQuickViewOne from "../action-buttons/AddToQuickViewOne";
import ModalTriggerButton from "../action-buttons/ModalTriggerButton";
import { useCurrency } from "@/lib/currency";
import ProductSellerStack from "@/components/sellers/ProductSellerStack";
import styles from "./ProductCard9.module.css";

export default function ProductCard9({
  product,
  detailsPageUrl = "/product",
  showPricingBadge = true,
  shouldShowTimer = true,
  countdownStyle = "default",
  showBestSellerBadge = false,
  showQuantityBadge = false,
  animationOrder = 1,
}: {
  product: Product;
  detailsPageUrl?: string;
  showPricingBadge?: boolean;
  shouldShowTimer?: boolean;
  countdownStyle?: "default" | "compact";
  showBestSellerBadge?: boolean;
  showQuantityBadge?: boolean;
  animationOrder?: number;
}) {
  const detailsPageLink = `${detailsPageUrl}/${product.slug ?? product.id}`;
  const { formatPrice } = useCurrency();
  const [showMore, setShowMore] = useState(false);
  const hoverImgSrc = product.hoverImgSrc || undefined;
  return (
    <>
      <div
        className={`rbt-card rbt-product-card has-hover-box-shadow ${
          product.isStockOut ? "rbt-stock-out-product-card" : ""
        }`}
      >
        <div
          className={`inner rbt-scroll-trigger fade_in animation-order-${animationOrder}`}
        >
          <div
            className={`rbt-card-img ${
              hoverImgSrc ? "rbt-has-hover-img" : ""
            } rbt-bg-color-default ${styles.imageFrame}`}
          >
            <Link href={detailsPageLink} prefetch>
              <Image
                className="rbt-prd-img"
                alt="Card Image"
                src={product.imgSrc}
                fill
                sizes="(max-width: 575px) 50vw, (max-width: 991px) 33vw, (max-width: 1399px) 25vw, 420px"
              />
              {hoverImgSrc && (
                <Image
                  className="rbt-hover-img"
                  alt="Card Image"
                  src={hoverImgSrc}
                  fill
                  sizes="(max-width: 575px) 50vw, (max-width: 991px) 33vw, (max-width: 1399px) 25vw, 420px"
                />
              )}
            </Link>
            {product.badges && product.badges.length > 0 && (
              <div className="rbt-badge-wrapper rbt-content-top-left">
                {product.badges.map((badge, index) => (
                  <div
                    key={index}
                    className={`rbt-product-badge ${badge.bg} border-rounded`}
                  >
                    {badge.text}
                  </div>
                ))}
              </div>
            )}
            {product.watchingTooltip && (
              <Tooltip
                content={`👁️ ${product.watchingTooltip} People Are Watching This Item`}
                placement="bottom"
              >
                <div className="rbt-discount-badge right--corner-style tooltips">
                  <span>
                    <i className="fa-regular fa-eye" />
                    {product.watchingTooltip}
                  </span>
                </div>
              </Tooltip>
            )}
            <div className="rbt-quick-btn-grp has-mixup-midlayer bottom-right--position">
              <Tooltip content="Quick View" placement="left">
                <AddToQuickViewOne
                  product={product}
                  className={`rbt-search-btn rbt-quick-btn tooltips ${
                    product.id === 2 ? "rbt-quickview-sidenav-activation" : ""
                  }`}
                  type="button"
                  openModalName="quickViewModal"
                >
                  <i className="fa-regular fa-magnifying-glass-plus" />
                </AddToQuickViewOne>
              </Tooltip>

              <AddToWishlist product={product} />
            </div>
            {product.countdown &&
              shouldShowTimer &&
              countdownStyle === "default" && (
                <div className="rbt-countdown-wrap rbt-content-bottom-center rbt-countdown-one bg-variation-black cd-border-style">
                  <Countdown />
                </div>
              )}
          </div>
          <div className="rbt-card-body">
            {(product.category?.length ?? 0) > 0 && (
              <div>
                {product.category?.map((item, index) => (
                  <Link
                    key={index}
                    href={`/shop-by-categories`}
                    className="rbt-card-subtitle rbt-card-categories-text"
                  >
                    {item}
                  </Link>
                ))}
              </div>
            )}
            <h6 className="rbt-card-title">
              <Link href={detailsPageLink} prefetch>
                {product.title}
              </Link>
            </h6>
            <div className="rbt-card-rating">
              <ul className="rbt-rating-icon-list">
                {Array.from({ length: 5 }, (_, index) => (
                  <li key={index}>
                    <i
                      className={`fa-solid fa-star${index < (product.rating ?? 0) ? " rbt-rated-icon" : ""}`}
                    />
                  </li>
                ))}
              </ul>
              <p className="rating-digit">({product.reviewCount})</p>
              {product.extraInfo && product.extraInfo.length > 0 && <Facts />}
              <ProductSellerStack href={detailsPageLink} sellers={product.sellers} />
            </div>
            <div className="pricing-part">
              {product.oldPrice && (
                <del className="price-text">{formatPrice(product.oldPrice)}</del>
              )}
              <span className="price-text">
                {typeof product.price === "number"
                  ? formatPrice(product.price)
                  : product.price}
              </span>

              <OfferBadge product={product} variant="minus" />

              {product.pricingBadges &&
                showPricingBadge &&
                product.pricingBadges.map((badge, index) => (
                  <div key={index} className={`rbt-badge ${badge.bg}`}>
                    {badge.text}
                  </div>
                ))}
            </div>
            {showBestSellerBadge && (
              <span className="rbt-product-feature-badge">
                🏆#1 Best Sellers
              </span>
            )}
            {countdownStyle === "compact" && (
              <div className="rbt-countdown-one">
                <Countdown style={2} />
              </div>
            )}
            {showQuantityBadge && (
              <div className="rbt-prd-qty-area">
                <p className="prd-qty-txt">
                  Only <strong>{product.availableQuantity}</strong> pc left
                </p>
                <div
                  className="progress"
                  role="progressbar"
                  aria-label="Shipping-progress"
                  aria-valuenow={50}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <div className="progress-bar w-50"></div>
                </div>
              </div>
            )}
            <div className="prd-btn-grp">
              {product.isStockOut ? (
                <ModalTriggerButton
                  className="rbt-btn rbt-btn-border rbt-btn-sm rbt-square-btn d-block has-left-icon"
                  openModalName="notifyModal"
                >
                  <i className="fa-regular fa-bell" /> Notify Me
                </ModalTriggerButton>
              ) : (
                <AddToCart
                  parentClass="rbt-btn rbt-btn-border rbt-btn-sm rbt-square-btn d-block has-left-icon rbt-cart-sidenav-activation"
                  product={product}
                  detailsPageUrl={detailsPageUrl}
                />
              )}
              <AddToCompareThree product={product} />
            </div>
          </div>
        </div>
        <div
          className={`prd-details-area rbt-has-show-more ${showMore ? "active" : ""}`}
        >
          <div className="wrapper rbt-has-show-more-inner-content">
            <ul className="product-details-list">
              {product.productDetails &&
                product.productDetails.map((detail, index) => (
                  <li key={index}>
                    <span className="rbt-bold--text mr--1">
                      {detail.label} :
                    </span>
                    {Array.isArray(detail.text) ? (
                      detail.text.map((line, lineIndex) => (
                        <span
                          key={lineIndex}
                          className={`text ${lineIndex > 0 ? "d-block" : ""}`}
                        >
                          {line}
                        </span>
                      ))
                    ) : (
                      <span className="text ml--4">{detail.text}</span>
                    )}
                  </li>
                ))}
            </ul>
            <ul className="product-details-list shipment-details-list">
              {product.shipmentDetails &&
                product.shipmentDetails.map((shipment, index) => (
                  <li key={index}>
                    <span className="icon">
                      <i className={shipment.icon} />
                    </span>
                    <div className="right-content">
                      {shipment.label && (
                        <span className="rbt-bold--text mr--1">
                          {shipment.label} :
                        </span>
                      )}
                      {shipment.text && (
                        <span className="text ml--4">
                          {shipment.text} {``}
                        </span>
                      )}
                      {shipment.link && (
                        <a
                          href={shipment.link.href}
                          className="shipment-quick-link rbt-btn-link ml--4"
                        >
                          {shipment.link.text}
                        </a>
                      )}
                    </div>
                  </li>
                ))}
            </ul>
          </div>
          <div className={`rbt-show-more-btn-area ${showMore ? "active" : ""}`}>
            <button
              type="button"
              className="rbt-show-more-btn"
              onClick={() => setShowMore((prev) => !prev)}
            >
              {showMore ? "Show Less" : "Show More"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
