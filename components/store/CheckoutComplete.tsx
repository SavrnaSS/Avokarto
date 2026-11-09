"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { readLastOrder, type LastOrder } from "@/lib/lastOrder";
import { useCheckoutDetails } from "@/hooks/use-checkout-details";
import { BUNDLE_DISCOUNT_PERCENT } from "@/lib/bundleDiscount";
import { useLiveProducts } from "@/hooks/use-live-products";
import { useRecentlyViewedProducts } from "@/hooks/use-recently-viewed";
import { useTopSellingProducts } from "@/hooks/use-top-selling-products";
import { useCurrency } from "@/lib/currency";
import { getProductDetailsHref } from "@/lib/productLinks";
import type { Product } from "@/types";

const SUGGESTION_COUNT = 4;

function isPurchasable(product: Product) {
  if (product.inStock === false || product.isStockOut) return false;
  if (typeof product.availableQuantity === "number") {
    return product.availableQuantity > 0;
  }
  return product.price > 0;
}

/**
 * Live "You may also like" picks after an order: what the shopper recently
 * viewed first, then this month's best-sellers, then the wider catalog -
 * de-duplicated, in stock only, and kept current via realtime updates.
 */
function useThankYouSuggestions() {
  const recent = useRecentlyViewedProducts({ limit: 6 });
  const bestsellers = useTopSellingProducts({ period: "this-month", limit: 8 });
  const catalog = useLiveProducts({ limit: 12 });

  const products = useMemo(() => {
    const seen = new Set<string>();
    const picks: Product[] = [];
    for (const pool of [recent.products, bestsellers.products, catalog.products]) {
      for (const product of pool) {
        const key = product.catalogId ?? product.slug ?? String(product.id);
        if (seen.has(key) || !isPurchasable(product)) continue;
        seen.add(key);
        picks.push(product);
        if (picks.length === SUGGESTION_COUNT) return picks;
      }
    }
    return picks;
  }, [recent.products, bestsellers.products, catalog.products]);

  const loading =
    recent.loading ||
    (bestsellers.loading && !bestsellers.hasData) ||
    (catalog.loading && !catalog.hasData);

  return { products, loading };
}

export default function CheckoutComplete({
  orderNumber = "",
}: {
  // From the page's ?order= search param (read on the server, so server and
  // client render the same markup - no hydration mismatch).
  orderNumber?: string;
}) {
  const { formatPrice } = useCurrency();
  // The order the shopper just placed, from their own browser (see
  // lib/lastOrder.ts) - read after mount, so server and client first render
  // the same "loading" markup.
  const [order, setOrder] = useState<LastOrder | null>(null);
  const [checked, setChecked] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOrder(readLastOrder(orderNumber));
    setChecked(true);
  }, [orderNumber]);

  // The order is placed: clear the saved checkout form (address, shipping
  // choice) now that the payment step - which redirects when it's empty -
  // has unmounted.
  useEffect(() => {
    useCheckoutDetails.getState().reset();
  }, []);
  const suggestions = useThankYouSuggestions();

  return (
    <div className="rbt-component-area rbt-cart-page rbt-section-gapBottom rbt-bg-color-white">
      <div className="container">
        <div className="row row--12 mt_dec--24 justify-content-center">
          <div className="col-xl-8 col-12 col-md-12 col-lg-12 mt--24 rbt-scrollable-content rbt-checkout-single-content">
            <div className="w-100 pt-sm-2 pt-md-3 pt-lg-4 pb-lg-4 pb-xl-5 px-3 px-sm-4 pe-lg-0 ps-lg-5">
              <div className="d-flex align-items-sm-center border-bottom pb-3 pb-md-4 active">
                <div className="rbt-checkout-step rbt-bg-color-success rbt-text-color-white">
                  <i className="fa-solid fa-check" />
                </div>
                <div className="w-100 ps-3">
                  {orderNumber ? (
                    <div className="fs-sm mb-1">Order #{orderNumber}</div>
                  ) : null}
                  <div className="d-sm-flex align-items-center">
                    <h1 className="h4 mb-0 me-3">Thank you for your order!</h1>
                    <div className="nav mt-2 mt-sm-0 ms-auto rbt-link-hover">
                      <Link className="nav-link p-0" href="/my-order-history">
                        Track order
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
              {!checked ? (
                <div
                  className="mt-4"
                  aria-busy="true"
                  style={{ height: 180, borderRadius: 12, background: "var(--color-gray-100, #f3f3f3)" }}
                />
              ) : order ? (
                <div className="d-flex flex-column gap-4 pt-3 pb-4 mt-3">
                  <p className="fs-sm mb-0 rbt-text-color-gray-600">
                    Placed on{" "}
                    {new Date(order.placedAt).toLocaleString(undefined, {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                    {order.email ? (
                      <>
                        {" "}· Order details for <strong>{order.email}</strong>
                      </>
                    ) : null}
                  </p>
                  <div className="row g-4">
                    <div className="col-sm-6">
                      <h3 className="h6 mb-2">Deliver to</h3>
                      <p className="fs-sm mb-0">
                        <strong>{order.customerName}</strong>
                        {order.addressLines.map((line) => (
                          <span key={line} className="d-block">
                            {line}
                          </span>
                        ))}
                        {order.phone ? <span className="d-block">{order.phone}</span> : null}
                      </p>
                    </div>
                    <div className="col-sm-6">
                      {order.shippingMethod ? (
                        <>
                          <h3 className="h6 mb-2">Shipping</h3>
                          <p className="fs-sm mb-3">
                            {order.shippingMethod.name}
                            {order.shippingMethod.estimate ? (
                              <span className="d-block rbt-text-color-gray-600">
                                {order.shippingMethod.estimate}
                              </span>
                            ) : null}
                          </p>
                        </>
                      ) : null}
                      <h3 className="h6 mb-2">Payment</h3>
                      <p className="fs-sm mb-0">{order.paymentMethod}</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="h6 mb-3">
                      Items ({order.items.reduce((sum, item) => sum + item.quantity, 0)})
                    </h3>
                    <ul className="list-unstyled mb-0 d-flex flex-column gap-3">
                      {order.items.map((item, index) => (
                        <li key={`${item.title}-${index}`} className="d-flex align-items-center gap-3">
                          {item.imgSrc ? (
                            <Image
                              src={item.imgSrc}
                              alt=""
                              width={56}
                              height={70}
                              style={{
                                width: 56,
                                height: 70,
                                objectFit: "cover",
                                objectPosition: "50% 22%",
                                borderRadius: 8,
                                background: "var(--color-gray-100, #f3f3f3)",
                                flex: "none",
                              }}
                            />
                          ) : null}
                          <div className="flex-grow-1" style={{ minWidth: 0 }}>
                            <p className="fs-sm mb-0 fw-medium">
                              {item.href ? <Link href={item.href}>{item.title}</Link> : item.title}
                            </p>
                            <p className="fs-sm mb-0 rbt-text-color-gray-600">
                              Qty {item.quantity} × {formatPrice(item.unitPrice)}
                              {item.regularUnitPrice ? (
                                <>
                                  {" "}
                                  <del>{formatPrice(item.regularUnitPrice)}</del>{" "}
                                  <span style={{ color: "var(--color-secondary, #5f8f18)", fontWeight: 600 }}>
                                    Bundle −{BUNDLE_DISCOUNT_PERCENT}%
                                  </span>
                                </>
                              ) : null}
                            </p>
                          </div>
                          <strong className="fs-sm">
                            {formatPrice(item.unitPrice * item.quantity)}
                          </strong>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <dl className="mb-0 pt-3 border-top fs-sm d-flex flex-column gap-2">
                    <div className="d-flex justify-content-between">
                      <dt className="fw-normal">Items</dt>
                      {/* Server subtotal is after bundle savings; show the
                          pre-discount amount here and the saving below. */}
                      <dd className="mb-0">
                        {formatPrice(order.subtotal + order.bundleDiscount)}
                      </dd>
                    </div>
                    {order.bundleDiscount > 0.004 ? (
                      <div
                        className="d-flex justify-content-between"
                        style={{ color: "var(--color-secondary, #5f8f18)", fontWeight: 600 }}
                      >
                        <dt className="fw-semibold">Bundle savings ({BUNDLE_DISCOUNT_PERCENT}%)</dt>
                        <dd className="mb-0">−{formatPrice(order.bundleDiscount)}</dd>
                      </div>
                    ) : null}
                    <div className="d-flex justify-content-between">
                      <dt className="fw-normal">Shipping</dt>
                      <dd className="mb-0">
                        {order.shippingCost === 0 ? "Free" : formatPrice(order.shippingCost)}
                      </dd>
                    </div>
                    <div className="d-flex justify-content-between h6 mb-0 pt-2 border-top">
                      <dt>Total</dt>
                      <dd className="mb-0">{formatPrice(order.total)}</dd>
                    </div>
                  </dl>
                </div>
              ) : (
                <div className="pt-4 pb-2">
                  <p className="fs-sm mb-2">
                    Your order is confirmed
                    {orderNumber ? (
                      <>
                        {" "}— keep your order number <strong>{orderNumber}</strong> for
                        reference
                      </>
                    ) : null}
                    .
                  </p>
                  <p className="fs-sm mb-0 rbt-text-color-gray-600">
                    Order details are shown right after checkout on the device you ordered
                    from. You can follow your order any time from{" "}
                    <Link href="/my-order-history">your order history</Link>.
                  </p>
                </div>
              )}
              <p className="rbt-link-hover fs-sm pt-4 pt-md-5 mt-2 mt-sm-3 mt-md-0 mb-0">
                Need help?
                <Link className="fw-medium ms-2" href="/contact">
                  Contact us
                </Link>
              </p>
            </div>
          </div>
          <div className="col-xl-4 col-lg-12 mt--24">
            <div className="row row--12">
              <div className="col-12 text-center">
                <h5 className="title mb--0">
                  <span className="rbt-bold--text">You May Also Like</span>
                </h5>
              </div>
            </div>
            <div className="row row--12 rbt-mobile-row">
              {/* Start Single Card  */}
              {suggestions.loading && !suggestions.products.length
                ? Array.from({ length: SUGGESTION_COUNT }, (_, index) => (
                    <div
                      key={`placeholder-${index}`}
                      className="col-xl-6 col-lg-3 col-sm-6 col-7 mt--24"
                      aria-hidden="true"
                    >
                      <div
                        style={{
                          aspectRatio: "4 / 5",
                          borderRadius: 12,
                          background: "var(--color-gray-100, #f3f3f3)",
                        }}
                      />
                    </div>
                  ))
                : null}
              {suggestions.products.map((product) => {
                const href = getProductDetailsHref(product);
                const category = product.category?.[0] ?? product.filterCategory?.[0];
                return (
                  <div
                    key={product.catalogId ?? product.id}
                    className="col-xl-6 col-lg-3 col-sm-6 col-7 mt--24"
                  >
                    <div className="rbt-card rbt-product-card has-hover-box-shadow">
                      <div className="inner">
                        <div className="rbt-card-img rbt-bg-color-default">
                          <Link href={href}>
                            <Image
                              alt={product.title}
                              src={product.imgSrc}
                              width={624}
                              height={780}
                              sizes="(max-width: 575px) 55vw, (max-width: 1199px) 25vw, 180px"
                              style={{
                                width: "100%",
                                height: "auto",
                                aspectRatio: "4 / 5",
                                objectFit: "cover",
                                objectPosition: "50% 22%",
                              }}
                            />
                          </Link>
                        </div>
                        <div className="rbt-card-body p-0 pt--4">
                          {category ? (
                            <Link
                              href={`/shop?category=${encodeURIComponent(category)}`}
                              className="rbt-card-subtitle rbt-card-categories-text"
                            >
                              {category}
                            </Link>
                          ) : null}
                          <h6 className="rbt-card-title b3">
                            <Link href={href}>{product.title}</Link>
                          </h6>
                          <div className="pricing-part">
                            <span className="price-text">{formatPrice(product.price)}</span>
                            {product.oldPrice && product.oldPrice > product.price ? (
                              <del className="ms-2 rbt-text-color-gray-500 b3">
                                {formatPrice(product.oldPrice)}
                              </del>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              {/* End Single Card  */}
            </div>
            {/* End Card Area */}
          </div>
        </div>
      </div>
    </div>
  );
}
