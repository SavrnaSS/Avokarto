"use client";
import Image from "next/image";

import type { Product } from "@/types";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useCurrency } from "@/lib/currency";
import { useCartQuantityAction } from "@/hooks/useCartQuantityAction";
import { useLiveProduct } from "@/hooks/use-live-product";

export default function BottomStickyProduct({
  product: initialProduct,
  detailsPageUrl = "/product",
}: {
  product: Product;
  detailsPageUrl?: string;
}) {
  const { product } = useLiveProduct(initialProduct);
  const {
    buttonLabel, isDisabled, isOutOfStock, applyCartAction,
    buyNow, isBuyingNow, isBuyNowDisabled,
  } = useCartQuantityAction(product, detailsPageUrl);
  const { formatPrice } = useCurrency();
  const sectionRef = useRef(null);
  const [active, setActive] = useState(false);
  const detailsHref = `${detailsPageUrl}/${product.slug ?? product.id}`;

  useEffect(() => {
    const handleScroll = () => {
      const topPos = window.scrollY || window.pageYOffset;
      const documentHeight = document.documentElement.scrollHeight;
      const windowHeight = window.innerHeight;
      const filled = (topPos + windowHeight) / documentHeight;
      const targetPosition = documentHeight * 0.36;

      setActive(topPos > targetPosition && filled !== 1);
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div
      ref={sectionRef}
      className={`rbt-minicart-bottom-section rbt-product-card${active ? " rbt-minicart-bottom-section-active" : ""}`}
    >
      <div className="container">
        <div className="row align-items-center justify-content-between mt_dec--12">
          <div className="col-lg-6 col-md-12 mt--12">
            <div className="rbt-prd-info-section">
              <div className="rbt-prd-img">
                <Link href={detailsHref}>
                  <Image
                    alt={product.title}
                    src={product.imgSrc}
                    width="220"
                    height="168"
                  />
                </Link>
              </div>
              <div className="rbt-content">
                <h6 className="rbt-title mb--0 rbt-text-bold">
                  <Link href={detailsHref}>{product.title}</Link>
                </h6>
                <p className="rbt-desc">
                  Complete your look with this selected fashion essential.
                </p>
              </div>
            </div>
          </div>
          <div className="col-lg-2 col-md-12 mt--12 mt_sm--16">
            <div className="rbt-minicart-bottom-section-center justify-content-center d-flex">
              <div className="pricing-part">
                {product.oldPrice != null && (
                  <del className="price-text rbt-text-semi-bold rbt-text-color-gray-400">
                    {formatPrice(product.oldPrice)}
                  </del>
                )}
                <span className="price-text rbt-text-bold rbt-text-color-heading">
                  {formatPrice(product.price)}
                </span>
              </div>
            </div>
          </div>
          <div className="col-lg-4 col-md-12 mt--12 mt_sm--16">
            <div className="rbt-minicart-bottom-section-right d-flex">
              <div className="minicart-btn-grp d-flex rbt-gap--16">
                <button
                  type="button"
                  className="rbt-btn rbt-btn-border rbt-btn-sm d-block has-left-icon"
                  disabled={isDisabled}
                  onClick={applyCartAction}
                >
                  <i className="fa-regular mr fa-cart-shopping" />{" "}
                  {buttonLabel}
                </button>
                <button
                  type="button"
                  className="rbt-btn rbt-btn-sm d-block"
                  disabled={isBuyNowDisabled}
                  aria-busy={isBuyingNow}
                  onClick={() => buyNow()}
                >
                  {isOutOfStock ? "Out of Stock" : "Buy Now"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
