"use client";

import Image from "next/image";
import ProductRating from "@/components/common/ui/ProductRating";
import { allProducts } from "@/data/products";
import Link from "next/link";
import Tooltip from "@/components/common/ui/Tooltip";
import { useCurrency } from "@/lib/currency";

import { useAdjacentProducts } from "@/hooks/use-adjacent-products";
import { Product } from "@/types";
import { categoryShopHref } from "@/lib/storefront-categories";
export default function BreadCrumb({
  product,
  isFullWidth = false,
  products = allProducts,
  detailsPageUrl = "/product",
}: {
  product: Product;
  isFullWidth?: boolean;
  products?: Product[];
  detailsPageUrl?: string;
}) {
  const id = product.id;
  const { formatPrice } = useCurrency();

  // A real, DB-backed product (has a catalogId) browses its real neighbors
  // by creation order instead of the hardcoded static demo catalog this
  // component used to fall back to unconditionally - that fallback used
  // `product.id - 1` / `+ 1` arithmetic, which is meaningless for a real
  // product's UUID id and always landed on the same fixed array-boundary
  // demo product regardless of which real product was open. Only products
  // rendered without a catalogId (the static template-preview routes with
  // no database configured) still use the static `products` list below.
  const isLive = Boolean(product.catalogId);
  const { next: liveNext, prev: livePrev } = useAdjacentProducts({
    catalogId: isLive ? product.catalogId : null,
  });

  // Find previous product
  const prevProduct = isLive
    ? livePrev
    : products.find((p) => p.id === Number(id) - 1) ||
      products[products.length - 1];

  // Find next product
  const nextProduct = isLive
    ? liveNext
    : products.find((p) => p.id === Number(id) + 1) || products[0];

  return (
    <div className="rbt-breadcrumb-two rbt-bg-color-white">
      <div className={isFullWidth ? "rbt-full-width-wrapper" : "container"}>
        <div className="row">
          <div className="col-lg-12">
            <div className="rbt-breadcrumb-inner d-flex align-items-center justify-content-between flex-nowrap">
              <ul aria-label="Breadcrumb" className="rbt-breadcrumb-page-list justify-content-start mt--0 flex-nowrap">
                <li className="rbt-breadcrumb-item">
                  <Link href={`/`}>Home</Link>
                </li>
                <li>
                  <div className="icon-right">
                    <i className="fa-solid fa-chevron-right" />
                  </div>
                </li>
                <li className="rbt-breadcrumb-item d-none d-md-block">
                  <Link href="/shop">Products</Link>
                </li>
                <li className="d-none d-md-block">
                  <div className="icon-right">
                    <i className="fa-solid fa-chevron-right" />
                  </div>
                </li>
                {(product.category?.length ?? 0) > 0 &&
                  product.category?.slice(0, 1).map((item, index) => (
                    <li key={index} className="d-none d-md-block">
                      <Link
                        href={categoryShopHref(item, product.categorySlug)}
                        className="rbt-breadcrumb-item"
                      >
                        {item}
                      </Link>
                    </li>
                  ))}
                {(product.category?.length ?? 0) > 0 && (
                  <li className="d-none d-md-block">
                    <div className="icon-right">
                      <i className="fa-solid fa-chevron-right" />
                    </div>
                  </li>
                )}
                <li aria-current="page" className="rbt-breadcrumb-item active text-nowrap text-truncate flex-grow-1">
                  {product.title}
                </li>
              </ul>
              <div className="rbt-single-nav">
                <div className="rbt-products-nav">
                  {prevProduct ? (
                    <div className="rbt-event-hover">
                      <Link
                        className="rbt-product-nav-btn rbt-round-btn rbt-btn-prev"
                        href={`${detailsPageUrl}/${prevProduct.slug ?? prevProduct.id}`}
                        aria-label="Previous product"
                      >
                        <i className="fa-regular fa-chevron-left" />
                      </Link>
                      <div className="rbt-dropdown rbt-dropdown-from-right">
                        <div className="rbt-card rbt-product-card rbt-list-view-variation rbt-list-view-sm rbt-bg-color-gray-light">
                          <div className="inner rbt-scroll-trigger fade_in animation-order-1">
                            <div className="rbt-card-body">
                              <ProductRating product={prevProduct} />
                              <h6 className="rbt-card-title">
                                <Link
                                  href={`${detailsPageUrl}/${prevProduct.slug ?? prevProduct.id}`}
                                >
                                  {prevProduct.title}
                                </Link>
                              </h6>
                              <div className="pricing-part">
                                {prevProduct.oldPrice && (
                                  <del className="price-text">
                                    {formatPrice(prevProduct.oldPrice)}
                                  </del>
                                )}
                                <span className="price-text">
                                  {formatPrice(prevProduct.price)}
                                </span>
                              </div>
                            </div>
                            <div className="rbt-card-img rbt-bg-color-default">
                              <Link href={`${detailsPageUrl}/${prevProduct.slug ?? prevProduct.id}`}>
                                <Image
                                  alt="Card Image"
                                  src={prevProduct.imgSrc}
                                  width={1072}
                                  height={824}
                                />
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : null}
                  <Tooltip content="Back To Products" placement="top">
                    <Link
                      href={`/shop`}
                      className="rbt-product-nav-btn rbt-round-btn tooltips"
                    >
                      <i className="fa-regular fa-grid-2" />
                    </Link>
                  </Tooltip>
                  {nextProduct ? (
                    <div className="rbt-event-hover">
                      <Link
                        className="rbt-product-nav-btn rbt-round-btn rbt-btn-next"
                        href={`${detailsPageUrl}/${nextProduct.slug ?? nextProduct.id}`}
                        aria-label="Next product"
                      >
                        <i className="fa-regular fa-chevron-right" />
                      </Link>
                      <div className="rbt-dropdown rbt-dropdown-from-right">
                        <div className="rbt-card rbt-product-card rbt-list-view-variation rbt-list-view-sm rbt-bg-color-gray-light">
                          <div className="inner rbt-scroll-trigger fade_in animation-order-1">
                            <div className="rbt-card-body">
                              <ProductRating product={nextProduct} />
                              <h6 className="rbt-card-title">
                                <Link
                                  href={`${detailsPageUrl}/${nextProduct.slug ?? nextProduct.id}`}
                                >
                                  {nextProduct.title}
                                </Link>
                              </h6>
                              <div className="pricing-part">
                                {nextProduct.oldPrice && (
                                  <del className="price-text">
                                    {formatPrice(nextProduct.oldPrice)}
                                  </del>
                                )}
                                <span className="price-text">
                                  {formatPrice(nextProduct.price)}
                                </span>
                              </div>
                            </div>
                            <div className="rbt-card-img rbt-bg-color-default">
                              <Link href={`${detailsPageUrl}/${nextProduct.slug ?? nextProduct.id}`}>
                                <Image
                                  alt="Card Image"
                                  src={nextProduct.imgSrc}
                                  width={1072}
                                  height={824}
                                />
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
