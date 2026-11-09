import OfferBadge from "@/components/common/ui/OfferBadge";
import Image from "next/image";
import Link from "next/link";
import Tooltip from "@/components/common/ui/Tooltip";
import { Product } from "@/types";
import AddToQuickViewOne from "../action-buttons/AddToQuickViewOne";
import AddToWishlistTwo from "../action-buttons/AddToWishlistTwo";

export default function ProductCard5({
  product,
  detailsPageUrl = "/product",
  imbBgClass = "",
  contentBgClass = "",
  starClass = "",
  animationOrder = 1,
}: {
  product: Product;
  detailsPageUrl?: string;
  imbBgClass?: string;
  contentBgClass?: string;
  starClass?: string;
  animationOrder?: number;
}) {
  const detailsPageLink = `${detailsPageUrl}/${product.slug ?? product.id}`;
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

  return (
    <div
      className={`rbt-card rbt-product-card rbt-scroll-trigger fade_in animation-order-${animationOrder}`}
    >
      <div
        className={`rbt-card-img top-rounded-md rbt-scroll-trigger ${
          product.hoverImg ? "rbt-has-hover-img" : ""
        } ${imbBgClass} zoom_in animation-order-${animationOrder}`}
      >
        <Link href={detailsPageLink}>
          <Image
            alt="Card Image"
            src={product.imgSrc}
            width={312} // Using the smaller dimension from the HTML
            height={312} // Using the smaller dimension from the HTML
          />

          {product.hoverImg && (
            <Image
              alt="Card Image"
              src={product.hoverImg}
              width={312} // Using the smaller dimension from the HTML
              height={312} // Using the smaller dimension from the HTML
              className="rbt-hover-img"
            />
          )}
        </Link>
        {product.badge && (
          <div
            className={`${product.badge.bg} rbt-product-badge  rbt-badge-top-left--position`}
          >
            {" "}
            {/* Adjusted class structure */}
            {product.badge.text}
          </div>
        )}
        <div className="rbt-quick-btn-grp has-mixup-midlayer rbt-top-right--position hover-variation-one">
          <AddToWishlistTwo
            parentClass="rbt-wishlist-btn bg-light-one rbt-quick-btn tooltips"
            product={product}
          />
          <Tooltip content="Quick View" placement="left">
            <AddToQuickViewOne
              product={product}
              className="rbt-watch-btn bg-light-one rbt-quick-btn tooltips"
              type="button"
              openModalName="quickViewModal"
            >
              <i className="fa-sharp fa-regular fa-magnifying-glass" />
            </AddToQuickViewOne>
          </Tooltip>
        </div>

        <AddToQuickViewOne
          product={product}
          className="rbt-btn hover-appear-element bottom-position text-center rbt-btn-sm rbt-square-btn d-block has-left-icon"
          openModalName="quickViewModal"
        >
          Select Option
        </AddToQuickViewOne>
      </div>
      <div
        className={`rbt-card-body rbt-card-body-center-align ${contentBgClass}`}
      >
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
          <ul className={`rbt-rating-icon-list ${starClass} `}>
            {product.rating ? renderRatingStars(product.rating) : null}
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
