"use client";

import { FireIcon } from "../svg-icons";
import { Fragment, useState } from "react";
import Image from "next/image";
import Link from "next/link";

import { useContextElement } from "@/context/Context";
import ShareCartButton from "@/components/action-buttons/ShareCartButton";
import Tooltip from "@/components/common/ui/Tooltip";
import useCopyToClipboard from "@/hooks/useCopyToClipboard";
import SearchableDropdown from "@/components/common/select/SearchableDropdown";
import { getCartSummary } from "../../lib/cartSummaryUtils";
import { useStorePolicy } from "@/hooks/useStorePolicy";
import {
  getCartItemCount,
  getCartPricing,
  MAX_CART_QUANTITY,
} from "@/lib/cartQuantity";
import {
  BUNDLE_DISCOUNT_PERCENT,
  bundleUnitPrice,
  qualifyingBundleIds,
} from "@/lib/bundleDiscount";
import type { CartProduct } from "@/types";
import styles from "./Cart.module.css";
import { getProductDetailsHref } from "@/lib/productLinks";
import { useCartReservationTimer } from "@/hooks/useCartReservationTimer";
import { useCurrency } from "@/lib/currency";
import { Swiper, SwiperSlide } from "swiper/react";
import { Scrollbar } from "swiper/modules";
import CartBundleSavings from "@/components/store/CartBundleSavings";
import FreeShippingProgress from "@/components/store/FreeShippingProgress";
import CartCatalogStatus from "./CartCatalogStatus";

export default function Cart() {
  const { cartProducts, totalPrice, setCartProducts, updateQuantity } =
    useContextElement();
  const { formatPrice } = useCurrency();
  const shippingCityOptions = [
    "Select your City",
    "New York",
    "London",
    "Paris",
    "Tokyo",
    "Dubai",
    "Singapore",
    "Sydney",
    "Berlin",
    "Toronto",
    "Los Angeles",
  ];
  const [selectedShippingCity, setSelectedShippingCity] =
    useState("Select your City");
  const hasCartItems = cartProducts.length > 0;
  const totalCartItems = getCartItemCount(cartProducts);
  const reservationTimer = useCartReservationTimer(
    hasCartItems,
    cartProducts.map((product) => `${product.id}:${product.quantity}`).join("|"),
  );

  const removeItem = (id: string | number) => {
    setCartProducts((prev) =>
      prev.filter((product) => String(product.id) !== String(id)),
    );
  };

  // Group qualifying bundles (2+ products sharing a bundleId) so they read
  // as one purchase; everything else - including a lone leftover from a
  // broken-up bundle, which no longer gets the discount - lists normally.
  const activeBundles = qualifyingBundleIds(
    cartProducts.map((line) => ({ key: String(line.id), bundleId: line.bundleId })),
  );
  const bundleGroups = new Map<string, CartProduct[]>();
  const looseItems: CartProduct[] = [];
  for (const line of cartProducts) {
    if (line.bundleId && activeBundles.has(line.bundleId)) {
      bundleGroups.set(line.bundleId, [...(bundleGroups.get(line.bundleId) ?? []), line]);
    } else {
      looseItems.push(line);
    }
  }

  const removeBundle = (bundleId: string) => {
    setCartProducts((prev) => prev.filter((product) => product.bundleId !== bundleId));
  };
  // Re-render when the admin's free-shipping rule loads or changes.
  useStorePolicy();
  const {
    subtotalLabel,
    shippingTotal,
    shippingPending,
    hasItems,
    orderTotal,
  } = getCartSummary(totalPrice, totalCartItems);
  const { registerInputRef, getTooltip, copyFromRef, isCopied } =
    useCopyToClipboard({ defaultTooltip: "Copy" });

  const renderRow = (product: CartProduct, bundled: boolean) => {
    const productHref = getProductDetailsHref(product);
    const unit = bundled ? bundleUnitPrice(product.price) : product.price;

    return (
      <tr
        key={product.id}
        className={`${styles.itemRow} ${bundled ? styles.bundleRow : ""}`}
      >
        <td className={styles.cellProduct}>
          <div className="cart-product-card">
            <div className="product-thumbnail">
              <Link href={productHref}>
                <Image
                  alt={product.title || "Product image"}
                  src={
                    product.imgSrc ||
                    "/assets/images/wishlist/wishlist-prd-1.webp"
                  }
                  // Fills its frame by itself (absolute, inset 0) so the photo
                  // can never render at a fixed intrinsic size and show only
                  // a corner of itself if a stylesheet loads late.
                  fill
                  sizes="96px"
                  style={{ objectFit: "cover", objectPosition: "50% 22%" }}
                />
              </Link>
              <button
                type="button"
                className="close-btn"
                onClick={() => removeItem(product.id)}
                aria-label={`Remove ${product.title} from cart`}
              >
                <i className="fa-solid fa-xmark" />
              </button>
            </div>
            <div className="d-flex flex-column">
              <h6 className="rbt-wish-product-name">
                <Link href={productHref}>
                  {product.title}
                </Link>
              </h6>
              {product.sku ? (
                <span className="rbt-product-id">
                  <span className="rbt-text-semi-bold">SKU:</span>{" "}
                  {product.sku}
                </span>
              ) : null}
            </div>
          </div>
        </td>
        <td className={styles.cellPrice} data-label="Price">
          <h6 className="price-text">
            {formatPrice(unit)}
          </h6>
          {bundled ? (
            <del className={styles.regularPrice}>
              {formatPrice(product.price)}
            </del>
          ) : null}
        </td>
        <td className={styles.cellQty} data-label="Quantity">
          <div className="rbt-qty-area rbt-qty-sm">
            <button
              type="button"
              className="qty-item-btn qty-item-btn-decr"
              disabled={product.quantity <= 1}
              onClick={() => {
                if (product.quantity > 1) {
                  updateQuantity(
                    product.id,
                    product.quantity - 1,
                  );
                }
              }}
              aria-label="Decrease quantity"
            >
              <i className="fa-solid fa-minus" />
            </button>
            <input
              type="number"
              className="items-qty-input"
              value={product.quantity}
              min={1}
              max={MAX_CART_QUANTITY}
              inputMode="numeric"
              aria-label={`Quantity for ${product.title}`}
              onChange={(e) => {
                updateQuantity(
                  product.id,
                  e.currentTarget.valueAsNumber,
                );
              }}
            />
            <button
              type="button"
              className="qty-item-btn qty-item-btn-incr"
              disabled={product.quantity >= MAX_CART_QUANTITY}
              onClick={() =>
                updateQuantity(
                  product.id,
                  product.quantity + 1,
                )
              }
              aria-label="Increase quantity"
            >
              <i className="fa-solid fa-plus" />
            </button>
          </div>
        </td>
        <td className={styles.cellTotal} data-label="Total">
          <div>
            <h6 className="price-text">
              <span className="rbt-bold--text">
                {formatPrice(unit * product.quantity)}
              </span>
            </h6>
          </div>
        </td>
      </tr>
    );
  };

  return (
    <div className="rbt-component-area rbt-cart-page rbt-section-gap rbt-bg-color-white">
      <div className="container">
        <CartCatalogStatus />
        <div className="row row--12">
          <div className="col-lg-12">
            <div className="rbt-component-section-title d-flex justify-content-center align-items-center p-0 mb--24 border-0">
              <h2 className="rbt-title rbt-scroll-trigger fade_in animation-order-1">
                <span className="rbt-bold--text">Shopping Cart</span>
              </h2>
              {hasCartItems && (
                <div className="rbt-quick-info-tag d-flex">
                  <FireIcon />
                  <p>
                    Limited Item,{" "}
                    <strong>
                      {reservationTimer.isExpired ? (
                        "review your cart before checkout"
                      ) : (
                        <>
                          checkout within{" "}
                          <span className="rbt-countdown-cart">
                            {reservationTimer.label}
                          </span>
                        </>
                      )}
                    </strong>
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="row row--12 mt_dec--24">
          <div className="col-12 col-md-12 col-lg-8 mt--24">
            {/* Size container: the table becomes stacked cards when the cart
                column is narrow (phones/tablets), instead of scrolling
                sideways. The container is an outer element because a
                container query can't restyle the container itself. */}
            <div className={styles.cartArea}>
            <div
              className={`rbt-transparent-table-one-wrapper rbt-has-bg-gray rbt-scrollable-content ${styles.wrap}`}
            >
              <table
                className={`rbt-transparent-table-one table-variation-one mb--0 ${styles.table}`}
              >
                <thead>
                  <tr>
                    <th scope="col">Product</th>
                    <th scope="col">Price</th>
                    <th scope="col">Quantity</th>
                    <th scope="col">Total Price</th>
                  </tr>
                </thead>
                <tbody>
                  {cartProducts.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-5">
                        <p className="rbt-text-color-gray-600 mb--0">
                          Your cart is empty.
                        </p>
                        <Link
                          href="/shop"
                          className="rbt-btn rbt-btn-md rbt-btn-primary mt--16"
                        >
                          Continue Shopping
                        </Link>
                      </td>
                    </tr>
                  ) : (
                    <>
                      {[...bundleGroups.entries()].map(([bundleId, items]) => {
                        const groupPricing = getCartPricing(items);
                        return (
                          <Fragment key={bundleId}>
                            <tr className={styles.bundleHeadRow}>
                              <td colSpan={4}>
                                <div className={styles.bundleHead}>
                                  <span className={styles.bundleTitle}>
                                    <i className="fa-regular fa-cube" aria-hidden="true" />
                                    Bundle · {items.length} items
                                    <span className={styles.bundleBadge}>
                                      {BUNDLE_DISCOUNT_PERCENT}% off
                                    </span>
                                  </span>
                                  <span className={styles.bundleMeta}>
                                    <span className={styles.bundleSaving}>
                                      You save {formatPrice(groupPricing.discount)}
                                    </span>
                                    <button
                                      type="button"
                                      className={styles.bundleRemove}
                                      onClick={() => removeBundle(bundleId)}
                                    >
                                      Remove bundle
                                    </button>
                                  </span>
                                </div>
                              </td>
                            </tr>
                            {items.map((product) => renderRow(product, true))}
                          </Fragment>
                        );
                      })}
                      {looseItems.length && bundleGroups.size ? (
                        <tr className={styles.bundleHeadRow}>
                          <td colSpan={4}>
                            <span className={styles.otherTitle}>Other items</span>
                          </td>
                        </tr>
                      ) : null}
                      {looseItems.map((product) => renderRow(product, false))}
                    </>
                  )}
                </tbody>
              </table>
            </div>
            </div>
          </div>
          <div className="col-12 col-md-12 col-lg-4 mt--24">
            {/* The order summary + Checkout are shown first (CSS order) so
                the main action sits at the top of the column, above the
                optional shipping estimate / coupon / note tools. */}
            <div className={`rbt-sidebar-cart sticky-top ${styles.sidebar}`}>
              <div className={`inner-wrapper ${styles.toolsPanel}`}>
                {/* Start Single Widget */}
                <div className="rbt-sidebar-widget">
                  <div className="rbt-inner">
                    {/* single collapse item */}
                    <div className="rbt-single-collapse-item">
                      <a
                        className="rbt-collapse-btn d-flex justify-content-between align-items-center"
                        data-bs-toggle="collapse"
                        href="#rbt-collapse-item-1"
                        role="button"
                        aria-expanded="true"
                        aria-controls="rbt-collapse-item-1"
                      >
                        <h6 className="rbt-title rbt-text-bold mb--0">
                          <span className="mr--4">
                            <i className="fa-light fa-truck-fast" />
                          </span>
                          Estimate shipping rates
                        </h6>
                        <span className="rbt-icon">
                          <i className="fa-regular fa-chevron-down" />
                        </span>
                      </a>
                      <div className="collapse show" id="rbt-collapse-item-1">
                        <div className="rbt-offcanvas-inner-popup-card has-default-visible shipping-popup shadow-none p--0 bg-transparent">
                          <div className="rbt-offcanvas-card-inner">
                            <ul className="rbt-sidebar-list-wrapper liststyle mt--12">
                              <li className="rbt-check-group">
                                <input
                                  id="rbt-cat-list-brand-radio-1"
                                  type="radio"
                                  name="rbt-cat-list-brand-radio"
                                />
                                <label htmlFor="rbt-cat-list-brand-radio-1">
                                  <span className="rbt-label-content">
                                    Express Delivery
                                  </span>
                                </label>
                              </li>
                              <li className="rbt-check-group">
                                <input
                                  id="rbt-cat-list-brand-radio-2"
                                  type="radio"
                                  name="rbt-cat-list-brand-radio"
                                />
                                <label htmlFor="rbt-cat-list-brand-radio-2">
                                  <span className="rbt-label-content">
                                    Local Pickup :
                                    <span className="rbt-text-color-black rbt-text-bold">
                                      $10.00 (Flat Rate)
                                    </span>
                                  </span>
                                </label>
                              </li>
                              <li className="rbt-check-group">
                                <input
                                  id="rbt-cat-list-brand-radio-3"
                                  type="radio"
                                  name="rbt-cat-list-brand-radio"
                                />
                                <label htmlFor="rbt-cat-list-brand-radio-3">
                                  <span className="rbt-label-content">
                                    Regular Delivery
                                  </span>
                                </label>
                              </li>
                            </ul>
                            <p className="rbt-text-color-primary rbt-text-semi-bold b2 mb--16 mt--20">
                              <span className="mr--4">
                                <i className="fa-light fa-truck-fast" />
                              </span>
                              Estimate shipping
                            </p>
                            <form onSubmit={(e) => e.preventDefault()}>
                              <div className="rbt-input-field-grp mb--12">
                                <div className="rbt-dropdown-select filter-select rbt-modern-select search-by-category inner-width-100">
                                  <SearchableDropdown
                                    options={shippingCityOptions}
                                    selected={selectedShippingCity}
                                    onChange={setSelectedShippingCity}
                                    placeholder="Select your City"
                                    searchPlaceholder="Search Your City"
                                  />
                                </div>
                              </div>
                              <div className="rbt-input-field-grp mb--12">
                                <input
                                  className="rbt-bg-color-white"
                                  type="text"
                                  placeholder="State / County"
                                />
                              </div>
                              <div className="rbt-input-field-grp mb--12">
                                <input
                                  className="rbt-bg-color-white"
                                  type="text"
                                  placeholder="City"
                                />
                              </div>
                              <div className="rbt-input-field-grp">
                                <input
                                  className="rbt-bg-color-white"
                                  type="text"
                                  placeholder="Postcode / ZIP"
                                />
                              </div>
                              <div className="rbt-button-group m--0 mt--16">
                                <Link
                                  href="/checkout-shipping"
                                  className="rbt-btn rbt-btn-md rbt-btn-primary"
                                >
                                  Calculate shipping
                                </Link>
                                <button
                                  type="button"
                                  className="rbt-btn rbt-btn-md rbt-btn-gray-light text-center"
                                  onClick={() =>
                                    setSelectedShippingCity("Select your City")
                                  }
                                >
                                  Cancel
                                </button>
                              </div>
                            </form>
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* end single collapse item */}
                    <hr className="rbt-separator rbt-separator-gray200 mb--24 mt--24" />
                    {/* start single collapse item */}
                    <div className="rbt-single-collapse-item">
                      <a
                        className="rbt-collapse-btn collapsed d-flex justify-content-between align-items-center"
                        data-bs-toggle="collapse"
                        href="#rbt-collapse-item-2"
                        role="button"
                        aria-expanded="false"
                        aria-controls="rbt-collapse-item-2"
                      >
                        <h6 className="rbt-title rbt-text-bold mb--0">
                          <span className="mr--4">
                            <i className="fa-regular fa-ticket" />
                          </span>
                          Select or input Coupon
                        </h6>
                        <span className="rbt-icon">
                          <i className="fa-regular fa-chevron-down" />
                        </span>
                      </a>
                      <div className="collapse" id="rbt-collapse-item-2">
                        <div className="rbt-offcanvas-inner-popup-card has-default-visible shipping-popup shadow-none p--0 bg-transparent">
                          <div className="rbt-offcanvas-card-inner">
                            <div className="rbt-coupon-wrapper rbt-bg-color-gray-100">
                              <Swiper
                                className="swiper rbt-coupon-slide-active"
                                {...{
                                  slidesPerView: "auto",
                                  grabCursor: true,
                                  spaceBetween: 16,
                                  speed: 1000,
                                  scrollbar: {
                                    el: ".swiper-scrollbar",
                                    draggable: true,
                                  },
                                }}
                                modules={[Scrollbar]}
                              >
                                <SwiperSlide className="swiper-slide">
                                  <div className="rbt-coupon">
                                    <div className="inner rbt-text-copy-activation">
                                      <div className="left-part">
                                        <input
                                          ref={registerInputRef("cart-coupon-1")}
                                          type="text"
                                          defaultValue="WELCOME100"
                                          readOnly
                                          className="rbt-coupon-code-text rbt-has-right-shepe-border rbt-copy-value-field"
                                        />
                                      </div>
                                      <div className="coupon-details">
                                        <h2 className="rbt-coupon-info-title b1">
                                          UP TO 30% OFF
                                        </h2>
                                        <p className="rbt-coupon-info-sub-title b3 mt--4">
                                          For orders over $9.90
                                        </p>
                                        <ul className="rbt-coupon-info-list mt--12">
                                          <li>
                                            <span>
                                              12/18/2026 14:00 ~ 12/25/2026
                                              14:00
                                            </span>
                                          </li>
                                          <li>
                                            <span>
                                              The minimum spend for this coupon
                                              <strong>$200.00</strong>
                                            </span>
                                          </li>
                                        </ul>
                                      </div>
                                      <Tooltip
                                        content={getTooltip("cart-coupon-1")}
                                        placement="top"
                                        forceOpen={isCopied("cart-coupon-1")}
                                      >
                                        <button
                                          type="button"
                                          className="copy-icon rbt-round-btn rbt-bg-primary rbt-copy-btn"
                                          onClick={() => void copyFromRef("cart-coupon-1")}
                                        >
                                          <i className="fa-sharp fa-regular fa-copy" />
                                        </button>
                                      </Tooltip>
                                    </div>
                                  </div>
                                </SwiperSlide>
                                <SwiperSlide className="swiper-slide">
                                  <div className="rbt-coupon">
                                    <div className="inner rbt-text-copy-activation">
                                      <div className="left-part">
                                        <input
                                          ref={registerInputRef("cart-coupon-2")}
                                          type="text"
                                          defaultValue="WELCOME100"
                                          readOnly
                                          className="rbt-coupon-code-text rbt-has-right-shepe-border rbt-copy-value-field"
                                        />
                                      </div>
                                      <div className="coupon-details">
                                        <h2 className="rbt-coupon-info-title b1">
                                          UP TO 30% OFF
                                        </h2>
                                        <p className="rbt-coupon-info-sub-title b3 mt--4">
                                          For orders over $9.90
                                        </p>
                                        <ul className="rbt-coupon-info-list mt--12">
                                          <li>
                                            <span>
                                              12/18/2026 14:00 ~ 12/25/2026
                                              14:00
                                            </span>
                                          </li>
                                          <li>
                                            <span>
                                              The minimum spend for this coupon
                                              <strong>$200.00</strong>
                                            </span>
                                          </li>
                                        </ul>
                                      </div>
                                      <Tooltip
                                        content={getTooltip("cart-coupon-2")}
                                        placement="top"
                                        forceOpen={isCopied("cart-coupon-2")}
                                      >
                                        <button
                                          type="button"
                                          className="copy-icon rbt-round-btn rbt-bg-primary rbt-copy-btn"
                                          onClick={() => void copyFromRef("cart-coupon-2")}
                                        >
                                          <i className="fa-sharp fa-regular fa-copy" />
                                        </button>
                                      </Tooltip>
                                    </div>
                                  </div>
                                </SwiperSlide>
                                <SwiperSlide className="swiper-slide">
                                  <div className="rbt-coupon">
                                    <div className="inner rbt-text-copy-activation">
                                      <div className="left-part">
                                        <input
                                          ref={registerInputRef("cart-coupon-3")}
                                          type="text"
                                          defaultValue="WELCOME100"
                                          readOnly
                                          className="rbt-coupon-code-text rbt-has-right-shepe-border rbt-copy-value-field"
                                        />
                                      </div>
                                      <div className="coupon-details">
                                        <h2 className="rbt-coupon-info-title b1">
                                          UP TO 30% OFF
                                        </h2>
                                        <p className="rbt-coupon-info-sub-title b3 mt--4">
                                          For orders over $9.90
                                        </p>
                                        <ul className="rbt-coupon-info-list mt--12">
                                          <li>
                                            <span>
                                              12/18/2026 14:00 ~ 12/25/2026
                                              14:00
                                            </span>
                                          </li>
                                          <li>
                                            <span>
                                              The minimum spend for this coupon
                                              <strong>$200.00</strong>
                                            </span>
                                          </li>
                                        </ul>
                                      </div>
                                      <Tooltip
                                        content={getTooltip("cart-coupon-3")}
                                        placement="top"
                                        forceOpen={isCopied("cart-coupon-3")}
                                      >
                                        <button
                                          type="button"
                                          className="copy-icon rbt-round-btn rbt-bg-primary rbt-copy-btn"
                                          onClick={() => void copyFromRef("cart-coupon-3")}
                                        >
                                          <i className="fa-sharp fa-regular fa-copy" />
                                        </button>
                                      </Tooltip>
                                    </div>
                                  </div>
                                </SwiperSlide>
                                <div className="swiper-scrollbar" />
                              </Swiper>
                            </div>
                          </div>
                          <form onSubmit={(e) => e.preventDefault()}>
                            <div className="rbt-input-field-grp mt--24">
                              <p className="b1 mb--12 rbt-text-color-gray-600">
                                If you have coupon code, please apply it below.
                              </p>
                              <input
                                className="rbt-bg-color-white"
                                type="text"
                                placeholder="Coupon code"
                              />
                              <p className="b4 mb--0 rbt-text-color-danger mt--4">
                                Invalid Promo Code “WELCOME30”
                              </p>
                            </div>
                            <div className="rbt-button-group m--0 mt--16">
                              <button className="rbt-btn rbt-btn-md rbt-btn-primary">
                                Apply
                              </button>
                                        <button
                                          type="button"
                                          className="rbt-btn rbt-btn-md rbt-btn-gray-light"
                                        >
                                          Cancel
                                        </button>
                            </div>
                          </form>
                        </div>
                      </div>
                    </div>
                    {/* end single collapse item */}
                    <hr className="rbt-separator rbt-separator-gray200 mb--24 mt--24" />
                    {/* start single collapse item */}
                    <div className="rbt-single-collapse-item">
                      <a
                        className="rbt-collapse-btn collapsed d-flex justify-content-between align-items-center"
                        data-bs-toggle="collapse"
                        href="#rbt-collapse-item-3"
                        role="button"
                        aria-expanded="false"
                        aria-controls="rbt-collapse-item-3"
                      >
                        <h6 className="rbt-title rbt-text-bold mb--0">
                          <span className="mr--4">
                            <i className="fa-regular fa-pen" />
                          </span>
                          Add note for seller
                        </h6>
                        <span className="rbt-icon">
                          <i className="fa-regular fa-chevron-down" />
                        </span>
                      </a>
                      <div className="collapse" id="rbt-collapse-item-3">
                        <div className="rbt-offcanvas-inner-popup-card has-default-visible shipping-popup shadow-none p--0 bg-transparent">
                          <div className="rbt-offcanvas-card-inner">
                            <form onSubmit={(e) => e.preventDefault()}>
                              <div className="rbt-input-field-grp mb--12 mt--12">
                                <textarea
                                  className="rbt-text-field rbt-bg-color-white"
                                  name="message"
                                  placeholder="Notes about your order, e.g. special notes for delivery."
                                  defaultValue={""}
                                />
                              </div>
                              <div className="rbt-button-group m--0 mt--16">
                                <button className="rbt-btn rbt-btn-md rbt-btn-primary">
                                  Add Note
                                </button>
                                <button
                                  type="button"
                                  className="rbt-btn rbt-btn-md rbt-btn-gray-light"
                                >
                                  Cancel
                                </button>
                              </div>
                            </form>
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* end single collapse item */}
                  </div>
                </div>
                {/* End Single Widget */}
              </div>
              {/* Start Single Widget */}
              <div className={`rbt-sidebar-widget mt--24 ${styles.summaryPanel}`}>
                <div className="rbt-inner">
                  <CartBundleSavings subtotalLabel={subtotalLabel} />
                  <div className="rbt-cart-subttotal">
                    <p>Shipping</p>
                    <p className="price">
                      {!hasItems
                        ? "—"
                        : shippingPending
                          ? "Calculated at checkout"
                          : shippingTotal === 0 ? "Free" : formatPrice(shippingTotal)}
                    </p>
                  </div>
                  <hr className="mb--8 mt--8 rbt-bg-color-gray-200" />
                  <div className="rbt-cart-subttotal mb--12">
                    <p className="subtotal">
                      <strong>{shippingPending ? "Total before shipping" : "Total"}</strong>
                    </p>
                    <p className="price">{formatPrice(orderTotal)}</p>
                  </div>
                  <FreeShippingProgress subtotal={totalPrice} itemCount={totalCartItems} />
                  <div className="rbt-minicart-bottom mt--24">
                    <div className="checkout-btn mt--20">
                      {hasCartItems ? (
                        <Link
                          className="rbt-btn w-100 text-center"
                          href="/checkout-shipping"
                        >
                          <span className="btn-text">Checkout</span>
                        </Link>
                      ) : (
                        <button
                          type="button"
                          className="rbt-btn w-100 text-center disabled"
                          disabled
                        >
                          <span className="btn-text">Checkout</span>
                        </button>
                      )}
                    </div>
                    <div className="share-btn-grp rbt-link-hover">
                      <Link href="/cart" className="share-btn">
                        <i className="fa-regular fa-pen mr--4" /> View Cart
                      </Link>
                      <ShareCartButton
                        className="share-btn"
                        disabled={!hasCartItems}
                      >
                        <i className="fa-sharp fa-solid fa-link mr--4" /> Share
                        Cart
                      </ShareCartButton>
                    </div>
                    <ul className="rbt-cart-brand-list mt--24">
                      <li>
                        <span className="payment-img-link">
                          <Image
                            alt="eCommerce Brand Image"
                            src="/assets/images/payment-brand/image-01.webp"
                            width={812}
                            height={64}
                          />
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
              {/* End Single Widget */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
