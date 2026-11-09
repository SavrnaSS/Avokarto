"use client";

import Image from "next/image";
import Link from "next/link";
import Tooltip from "@/components/common/ui/Tooltip";
import { useProductImageSelection } from "@/hooks/useProductImageSelection";
import { Product } from "@/types";
import AddToCart from "../action-buttons/AddToCart";
import AddToCompareThree from "../action-buttons/AddToCompareThree";
import AddToWishlistTwo from "../action-buttons/AddToWishlistTwo";
export default function ProductCard16({
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
  return (
    <div
      className={`rbt-card rbt-product-card rbt-product-card-style-2 product-variation-two transform-variation-two rbt-scroll-trigger fade_in animation-order-${animationOrder}`}
    >
      <div className="background-expand" />
      <div className="card-inner">
        <div
          className={`rbt-card-img rbt-bg-color-white rbt-scroll-trigger zoom_in animation-order-${animationOrder}`}
        >
        <Link href={detailsPageLink}>
            <Image
              className="rbt-prd-img"
              alt="Product"
              src={selectedVariant}
              width={624}
              height={624}
            />
          </Link>
          {product.badge && (
            <div className="rbt-badge-wrapper rbt-content-top-left">
              <div
                className={`rbt-product-badge ${product.badge.bg} border-rounded`}
              >
                {product.badge.text}
              </div>
            </div>
          )}

          <AddToWishlistTwo product={product} />
          <ul className="product-hover-slider-list hover-slider-activation">
            {product.variants?.map((variant, index) => (
              <li key={index}>
                <Link
                  href={detailsPageLink}
                  data-src={variant.src}
                  className={selectedVariant === variant.src ? "active" : ""}
                  onMouseOver={(e) => {
                    e.preventDefault();
                    if (variant.src) {
                      setSelectedVariant(variant.src);
                    }
                  }}
                />
              </li>
            ))}
          </ul>
        </div>

        <div className="rbt-card-body rbt-bg-color-white">
          <div className="rbt-card-top-content">
            <div className="rbt-color-select-area">
              <ul className="rbt-switcher-color-list product-switcher-activation">
                {product.variants?.map((variant, idx) => (
                  <li
                    key={idx}
                    className={selectedVariant === variant.src ? "active" : ""}
                  >
                    <Tooltip content={variant.tooltip} placement="top">
                      <a
                        href="#"
                        className="rbt-switcher--color tooltips"
                        data-switcher-color={variant.hex}
                        data-src={variant.src}
                        onClick={(e) => {
                          e.preventDefault();
                          if (variant.src) {
                            setSelectedVariant(variant.src);
                          }
                        }}
                      >
                        <div
                          className="rbt-color-circle"
                          style={{ backgroundColor: variant.hex }}
                        />
                      </a>
                    </Tooltip>
                  </li>
                ))}
              </ul>
              <Link
                className="prd-link-text"
                href={detailsPageLink}
              >
                +{product.moreItemsLink} More Items
              </Link>
            </div>

            {(product.category?.length ?? 0) > 0 && (
              <div>
                {product.category?.map((item, index) => (
                  <Link
                    key={index}
                    href={`/shop-by-category`}
                    className="rbt-card-subtitle rbt-card-categories-text"
                  >
                    {item}
                  </Link>
                ))}
              </div>
            )}

            <h6 className="rbt-card-title">
            <Link href={detailsPageLink}>
                {product.title}
              </Link>
            </h6>

            <div className="rbt-card-rating">
              <ul className="rbt-rating-icon-list">
                {Array.from({ length: 5 }, (_, i) => (
                  <li key={i}>
                    <i
                      className={`fa-solid fa-star${i < (product.rating ?? 0) ? " rbt-rated-icon" : ""}`}
                    />
                  </li>
                ))}
              </ul>
              <p className="rating-digit">({product.reviewCount})</p>
            </div>

            <div className="pricing-part">
              <del className="price-text">${product.oldPrice?.toFixed(2)}</del>
              <span className="price-text">${product.price.toFixed(2)}</span>
            </div>
          </div>

          <div className="rbt-card-footer d-block footer-content-btn">
            <div className="prd-btn-grp">
              <AddToCart
                parentClass="rbt-btn rbt-btn-primary rbt-btn-sm rbt-square-btn d-block has-left-icon rbt-cart-sidenav-activation"
                product={product}
                detailsPageUrl={detailsPageUrl}
              />
              <AddToCompareThree product={product} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
