import OfferBadge from "@/components/common/ui/OfferBadge";
import Image from "next/image";
import Link from "next/link";

import type { Product } from "@/types";
import AddToCart from "../action-buttons/AddToCart";
import Tooltip from "@/components/common/ui/Tooltip";
import AddToCompare2 from "../action-buttons/AddToCompareTwo";
import AddToQuickViewOne from "../action-buttons/AddToQuickViewOne";
import AddToWishlistTwo from "../action-buttons/AddToWishlistTwo";

export default function ProductCard8({
  product,
  detailsPageUrl = "/product",
  imgBgColor = "",
  btnClass = "rbt-btn hover-appear-element bottom-position text-center rbt-btn-sm rbt-square-btn d-block has-left-icon rbt-cart-sidenav-activation",

  imgHeightClass = "",
  animationOrder = 1,
}: {
  product: Product;
  detailsPageUrl?: string;
  imgBgColor?: string;
  btnClass?: string;
  imgHeightClass?: string;
  animationOrder?: number;
}) {
  const detailsPageLink = `${detailsPageUrl}/${product.slug ?? product.id}`;
  return (
    <div
      className={`rbt-card rbt-product-card rbt-scroll-trigger fade_in animation-order-${animationOrder}`}
    >
      <div
        className={`rbt-card-img rbt-rounded--12 rbt-scroll-trigger ${imgBgColor} ${imgHeightClass} zoom_in animation-order-${animationOrder}`}
      >
        <Link href={detailsPageLink}>
          <Image
            alt="Card Image"
            src={product.imgSrc}
            width={312}
            height={312}
            className="rbt-bg-color-white"
          />
        </Link>
        {product.badge && (
          <div
            className={`rbt-product-badge ${product.badge.bg} rbt-badge-top-left--position`}
          >
            {product.badge.text}
          </div>
        )}
        <div className="rbt-quick-btn-grp has-mixup-midlayer rbt-top-right--position hover-variation-one">
          <AddToWishlistTwo
            parentClass="rbt-wishlist-btn bg-light-one rbt-quick-btn tooltips"
            product={product}
          />

          <AddToCompare2
            parentClass="rbt-compare-btn bg-light-one rbt-quick-btn tooltips"
            product={product}
          />
          <Tooltip content="Quick View" placement="left">
            <AddToQuickViewOne
              product={product}
              className="rbt-watch-btn bg-light-one rbt-quick-btn tooltips"
              type="button"
              openModalName="quickViewModal"
            >
              <i className="fa-sharp fa-regular fa-eye" />
            </AddToQuickViewOne>
          </Tooltip>
        </div>

        <AddToCart
          parentClass={btnClass}
          product={product}
          detailsPageUrl={detailsPageUrl}
        />
      </div>
      <div className="rbt-card-body rbt-card-body-center-align">
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
          <Link href={detailsPageLink}>
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
          <span className="icon">
            <i className="fa-sharp fa-solid fa-truck-fast" />
          </span>
        </div>
        <div className="pricing-part">
          {product.oldPrice && (
            <del className="price-text">${product.oldPrice.toFixed(2)}</del>
          )}
          <span className="price-text">${product.price.toFixed(2)}</span>
          <OfferBadge product={product} variant="minus" />
        </div>
      </div>
    </div>
  );
}
