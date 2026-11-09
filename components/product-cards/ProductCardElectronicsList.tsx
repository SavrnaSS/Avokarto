"use client";

import Image from "next/image";
import Link from "next/link";

import type { Product } from "@/types";

const renderStars = (rating: number) => {
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

export default function ProductSmallCard({
  product,
  detailsPageUrl = "/product",
  animationOrder = 1,
}: {
  product: Product;
  detailsPageUrl?: string;
  animationOrder?: number;
}) {
  const detailsPageLink = `${detailsPageUrl}/${product.slug ?? product.id}`;
  return (
    <div className="rbt-card rbt-product-card rbt-list-view-variation rbt-list-view-sm">
      <div
        className={`inner rbt-scroll-trigger fade_in animation-order-${animationOrder}`}
      >
        <div className="rbt-card-body">
          <div className="rbt-card-rating">
            <ul className="rbt-rating-icon-list">
              {renderStars(product.rating ?? 0)}
            </ul>
            <p className="rating-digit">({product.ratingCount})</p>
          </div>
          <h6 className="rbt-card-title">
            <Link href={detailsPageLink}>
              {product.title}
            </Link>
          </h6>
          <div className="pricing-part">
            <del className="price-text">
              ${(product.oldPrice ?? 0).toFixed(2)}
            </del>
            <span className="price-text">${product.price.toFixed(2)}</span>
          </div>
        </div>
        <div className="rbt-card-img rbt-bg-color-default rbt-curved-style-box">
          <Link href={detailsPageLink}>
            <Image
              alt="Card Image"
              src={product.imgSrc}
              width={278}
              height={212}
            />
          </Link>
        </div>
      </div>
    </div>
  );
}

