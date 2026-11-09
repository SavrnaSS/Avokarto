"use client";

import Image from "next/image";
import Link from "next/link";
import AddToCart from "../action-buttons/AddToCart";
import Tooltip from "@/components/common/ui/Tooltip";
import { useProductImageSelection } from "@/hooks/useProductImageSelection";
import { Product } from "@/types";
import AddToCompareThree from "../action-buttons/AddToCompareThree";
import AddToWishlistTwo from "../action-buttons/AddToWishlistTwo";
export default function ProductCard4({
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
  const renderRatingStars = (rating: number) => {
    const stars = [];
    for (let i = 0; i < 5; i++) {
      stars.push(
        <li key={i}>
          <i
            className={`fa-solid fa-star${i < rating ? " rbt-rated-icon" : ""}`}
          />
        </li>,
      );
    }
    return stars;
  };

  const renderColorVariants = (
    variants: import("@/types").ProductVariant[],
  ) => {
    return variants.map((variant, index) => (
      <li
        key={index}
        className={selectedVariant === variant.src ? "active" : ""}
      >
        <Tooltip content={variant.color} placement="top">
          <a
            className="rbt-switcher--color tooltips"
            data-switcher-color={variant.hex}
            data-src={variant.src}
            href="#"
            onClick={(e) => {
              e.preventDefault();
              setSelectedVariant(variant.src);
            }}
          >
            <div
              className="rbt-color-circle"
              style={{ backgroundColor: variant.hex }}
            />
          </a>
        </Tooltip>
      </li>
    ));
  };

  return (
    <div
      className={`rbt-card rbt-product-card rbt-product-card-style-2 transform-variation-one rbt-scroll-trigger fade_in animation-order-${animationOrder}`}
    >
      <div className="rbt-card-img top-rounded-md">
        <Link href={detailsPageLink}>
          <Image
            className={`rbt-scroll-trigger fade_in animation-order-${animationOrder} rbt-prd-img`}
            alt="Card Image"
            src={selectedVariant}
            width={624}
            height={624}
          />
        </Link>
        {product.badge && (
          <div className="rbt-badge-wrapper rbt-content-top-left">
            <div className={`rbt-product-badge ${product.badge.bg}`}>
              {product.badge.text}
            </div>
          </div>
        )}
        <AddToWishlistTwo product={product} />
      </div>
      <div className="rbt-card-body rbt-bg-color-white">
        <div className="rbt-card-top-content">
          {product.variants && product.variants.length > 0 && (
            <div className="rbt-color-select-area">
              <ul className="rbt-switcher-color-list product-switcher-activation">
                {renderColorVariants(product.variants)}
              </ul>
              {product.moreItemsLink && (
                <Link
                  className="prd-link-text"
                  href={detailsPageLink}
                >
                  +{product.moreItemsLink} More Items
                </Link>
              )}
            </div>
          )}
          <h6 className="rbt-card-title">
            <Link href={detailsPageLink}>
              {product.title}
            </Link>
          </h6>
          <div className="rbt-card-rating">
            <ul className="rbt-rating-icon-list">
              {product.rating ? renderRatingStars(product.rating) : null}
            </ul>
            <p className="rating-digit">({product.reviewCount})</p>
          </div>
          <div className="pricing-part">
            {product.priceRange?.length === 2 && (
              <span className="price-text">
                ${product.priceRange[0]} - ${product.priceRange[1]}
              </span>
            )}
          </div>
        </div>
        <div className="rbt-card-footer d-block footer-content-btn">
          <div className="prd-btn-grp">
            <AddToCart
              parentClass="rbt-btn rbt-btn-black rbt-btn-sm rbt-square-btn d-block has-left-icon rbt-cart-sidenav-activation"
              product={product}
              detailsPageUrl={detailsPageUrl}
            />
            {/* <a
              className=""
              href="#"
            >
              <i className="fa-regular fa-file-plus-minus" />
              Add To Compare
            </a> */}
            <AddToCompareThree
              parentClass="rbt-btn rbt-btn-border rbt-btn-sm rbt-square-btn d-block rbt-btn-transparent has-left-icon rbt-compare-btn-activation"
              product={product}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
