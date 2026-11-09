"use client";
import OfferBadge from "@/components/common/ui/OfferBadge";
import Image from "next/image";
import Link from "next/link";
import Countdown from "../common/ui/Countdown";
import Facts from "../common/other-components/Facts";
import Tooltip from "@/components/common/ui/Tooltip";
import { useProductImageSelection } from "@/hooks/useProductImageSelection";

import { Product } from "@/types";
import AddToCart from "../action-buttons/AddToCart";
import AddToCompareOne from "../action-buttons/AddToCompareOne";
import AddToWishlist from "../action-buttons/AddToWishlistOne";
import AddToQuickViewOne from "../action-buttons/AddToQuickViewOne";
import ModalTriggerButton from "../action-buttons/ModalTriggerButton";
export default function ProductCard10({
  product,
  detailsPageUrl = "/product",
  animationOrder = 1,
}: {
  product: Product;
  detailsPageUrl?: string;
  animationOrder?: number;
}) {
  const detailsPageLink = `${detailsPageUrl}/${product.slug ?? product.id}`;
  const [selectedVariant, setSelectedVariant] =
    useProductImageSelection(product);
  const hoverImgSrc = product.hoverImgSrc || undefined;
  const hoverVideoSrc = product.hoverVideoSrc || undefined;

  return (
    <div
      className={`rbt-card rbt-product-card ${
        product.isStockOut ? "rbt-stock-out-product-card" : ""
      }`}
    >
      <div
        className={`inner rbt-scroll-trigger fade_in animation-order-${animationOrder}`}
      >
        <div
          className={`rbt-card-img rbt-rounded--12 rbt-bg-color-default ${
            hoverVideoSrc
              ? "rbt-has-hover-video"
              : hoverImgSrc
                ? "rbt-has-hover-img"
                : ""
          }`}
        >
          <Link href={detailsPageLink}>
            <Image
              className="rbt-prd-img"
              alt="Card Image"
              src={selectedVariant}
              width={1024} // Adjusted width/height based on the HTML
              height={793}
            />
            {hoverVideoSrc && (
              <video
                className="rbt-hover-video"
                src={hoverVideoSrc}
                muted
                loop
                autoPlay
                playsInline
                preload="none"
              />
            )}
            {hoverImgSrc && !hoverVideoSrc && (
              <Image
                className="rbt-hover-img"
                alt="Card Image"
                src={hoverImgSrc}
                width={1246} // Adjusted width/height based on the HTML
                height={976}
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
                className={`rbt-search-btn rbt-quick-btn tooltips`}
                type="button"
                openModalName="quickViewModal"
              >
                <i className="fa-regular fa-magnifying-glass-plus" />
              </AddToQuickViewOne>
            </Tooltip>
            <AddToWishlist product={product} />
          </div>
          {product.countdown && (
            <div className="rbt-countdown-wrap rbt-content-bottom-center rbt-countdown-one bg-variation-black cd-border-style">
              {/* You would likely use a library or custom logic to handle the countdown timer here */}
              <Countdown />
            </div>
          )}
        </div>
        <div className="rbt-card-body">
          {product.variants && product.variants.length > 0 && (
            <div className="rbt-color-select-area">
              <ul className="rbt-switcher-color-list product-switcher-activation">
                {product.variants.map((variant, index) => (
                  <li
                    key={index}
                    className={
                      selectedVariant === variant.imgSrc ? "active" : ""
                    }
                  >
                    <Tooltip content={variant.tooltip} placement="top">
                      <a
                        className="rbt-switcher--color tooltips"
                        data-switcher-color={variant.color}
                        data-src={variant.imgSrc}
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          if (variant.imgSrc) {
                            setSelectedVariant(variant.imgSrc);
                          }
                        }}
                      >
                        <div
                          className="rbt-color-circle"
                          style={{ backgroundColor: variant.color }}
                        ></div>
                      </a>
                    </Tooltip>
                  </li>
                ))}
              </ul>
              {product.moreVariantsText && (
                <Link className="prd-link-text" href={detailsPageLink}>
                  +{product.moreVariantsText} More Items
                </Link>
              )}
            </div>
          )}
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
            <Link href={detailsPageLink}>{product.title}</Link>
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
          </div>
          <div className="pricing-part">
            {product.oldPrice && (
              <del className="price-text">${product.oldPrice.toFixed(2)}</del>
            )}
            <span className="price-text">
              {typeof product.price === "number"
                ? `$${product.price.toFixed(2)}`
                : product.price}
            </span>
            <OfferBadge product={product} variant="minus" />
            {product.pricingBadges &&
              product.pricingBadges.map((badge, index) => (
                <div key={index} className={`rbt-badge ${badge.bg}`}>
                  {badge.text}
                </div>
              ))}
          </div>
          {product.quantityArea && (
            <div className="rbt-prd-qty-area">
              <p className="prd-qty-txt">
                Only <strong>{product.quantityArea.text}</strong> items left
              </p>{" "}
              <div
                className="progress"
                role="progressbar"
                aria-label="Shipping-progress"
                aria-valuenow={product.quantityArea.progress}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div
                  className="progress-bar"
                  style={{ width: `${product.quantityArea.progress}%` }}
                />
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

            <AddToCompareOne product={product} />
          </div>
        </div>
      </div>
    </div>
  );
}
