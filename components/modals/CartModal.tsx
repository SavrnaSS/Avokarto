"use client";
import { FireOrangeIcon } from "../svg-icons";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useContextElement } from "@/context/Context";
import ModalTriggerButton from "@/components/action-buttons/ModalTriggerButton";
import ShareCartButton from "@/components/action-buttons/ShareCartButton";
import { getCartSummary } from "@/lib/cartSummaryUtils";
import { useStorePolicy } from "@/hooks/useStorePolicy";
import { getProductDetailsHref } from "@/lib/productLinks";
import { getCartItemCount, MAX_CART_QUANTITY } from "@/lib/cartQuantity";
import { useCartReservationTimer } from "@/hooks/useCartReservationTimer";
import { getStackedModalZIndex } from "@/lib/modalStack";
import { useManagedModalPanel } from "@/hooks/useManagedModalPanel";
import { useCurrency } from "@/lib/currency";

import CartNotePopup from "./cart/CartNotePopup";
import CartShippingPopup from "./cart/CartShippingPopup";
import CartCouponPopup from "./cart/CartCouponPopup";
import CartRecommendations from "./cart/CartRecommendations";
import CartBundleSavings from "@/components/store/CartBundleSavings";
import FreeShippingProgress from "@/components/store/FreeShippingProgress";
import {
  BUNDLE_DISCOUNT_PERCENT,
  bundleUnitPrice,
  qualifyingBundleIds,
} from "@/lib/bundleDiscount";

export default function CartModal() {
  const [openTool, setOpenTool] = useState(-1);
  const [selectedShippingCity, setSelectedShippingCity] =
    useState("Select your City");
  const { activeBsModal, isAnimatedOpen, close } =
    useManagedModalPanel("cartSidebar");
  const { formatPrice } = useCurrency();
  // Recommendations load on the drawer's first open, then stay live.
  const [hasOpened, setHasOpened] = useState(false);
  if (isAnimatedOpen && !hasOpened) setHasOpened(true);

  const {
    cartProducts,
    totalPrice,
    setCartProducts,
    setActiveCartProduct,
    updateQuantity,
    mounted,
  } = useContextElement();

  const hasCartItems = mounted && cartProducts.length > 0;
  // Bundles that currently qualify - their items show the bundle price.
  const activeBundles = qualifyingBundleIds(
    cartProducts.map((line) => ({ key: String(line.id), bundleId: line.bundleId })),
  );
  const totalCartItems = getCartItemCount(cartProducts);
  const reservationTimer = useCartReservationTimer(
    hasCartItems,
    cartProducts.map((product) => `${product.id}:${product.quantity}`).join("|"),
  );

  const removeItem = (id: string | number) => {
    setCartProducts((pre) =>
      pre.filter((product) => String(product.id) !== String(id)),
    );
  };
  // Re-render when the admin's free-shipping rule loads or changes.
  useStorePolicy();
  const {
    subtotalLabel,
    shippingTotal,
    shippingPending,
    hasItems,
    orderTotal,
    amountToFreeShipping,
  } = getCartSummary(totalPrice, totalCartItems);

  return (
    <>
      <div
        className={`rbt-cart-side-menu rbt-sidebar-cart${isAnimatedOpen ? " side-menu-active" : ""}${openTool !== -1 ? " open-popup-overlay" : ""}`}
        onClick={() => setOpenTool(-1)}
        style={{
          zIndex: getStackedModalZIndex(activeBsModal, "cartSidebar"),
        }}
      >
        <div className="inner-wrapper">
          <div className="inner-top">
            <div className="rbt-cart-header">
              <div className="title-section">
                <h6 className="title mb--0">
                  <i className="fa-sharp fa-regular fa-cart-shopping mr--12" />{" "}
                  Your cart
                </h6>
              </div>
              {hasCartItems && (
                <div className="rbt-quick-info-tag d-flex mt--16 rbt-flash-animation">
                  <FireOrangeIcon />
                  <p>
                    Reserved item,{" "}
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
              <div className="rbt-btn-close" id="btn_sideNavClose">
                <button
                  type="button"
                  className="minicart-close-button rbt-round-btn"
                  onClick={() => {
                    close();
                  }}
                  aria-label="Close cart"
                >
                  <i className="fa-solid fa-xmark" />
                </button>
              </div>
            </div>
            <nav className="side-nav w-100">
              <ul className="rbt-minicart-wrapper">
                {mounted && cartProducts.length === 0 ? (
                  <li className="minicart-item">
                    <div className="product-content text-center w-100 py-4">
                      <h5 className="mb--8">Your cart is empty</h5>
                      <p className="b3 mb--0 rbt-text-color-gray-500">
                        Add products to see them here.
                      </p>
                      <div className="mt--16">
                        <Link href="/shop" className="rbt-btn rbt-btn-sm">
                          Browse Products
                        </Link>
                      </div>
                    </div>
                  </li>
                ) : (
                  mounted &&
                  cartProducts.map((product) => {
                    const productHref = getProductDetailsHref(product);

                    return (
                      <li key={product.id} className="minicart-item">
                        <div className="thumbnail">
                          <Link href={productHref}>
                            <Image
                              alt={product.title || "Product Image"}
                              src={
                                product.imgSrc ||
                                "/assets/images/product-img/cart-product/cart-product-01.webp"
                              }
                              width={1246}
                              height={976}
                            />
                          </Link>
                        </div>
                        <div className="product-content">
                          <h6 className="title">
                            <Link href={productHref}>{product.title}</Link>
                          </h6>
                          <span className="quantity">
                            {product.quantity}x{" "}
                            {product.bundleId && activeBundles.has(product.bundleId) ? (
                              <>
                                <span className="price">
                                  {formatPrice(bundleUnitPrice(product.price))}
                                </span>{" "}
                                <del className="rbt-text-color-gray-500" style={{ fontSize: 12 }}>
                                  {formatPrice(product.price)}
                                </del>{" "}
                                <span
                                  className="rbt-product-badge-bg-light-green"
                                  style={{
                                    display: "inline-block",
                                    padding: "0 6px",
                                    borderRadius: 999,
                                    fontSize: 11,
                                    fontWeight: 600,
                                    lineHeight: "18px",
                                    color: "var(--color-primary, #174d0a)",
                                    background: "var(--color-brand-50, #f2f8e8)",
                                  }}
                                >
                                  Bundle −{BUNDLE_DISCOUNT_PERCENT}%
                                </span>
                              </>
                            ) : (
                              <span className="price">
                                {formatPrice(product.price)}
                              </span>
                            )}
                          </span>
                          <div className="bottom-part">
                            <div className="rbt-qty-area">
                              <button
                                type="button"
                                aria-label={`Decrease quantity for ${product.title}`}
                                className="qty-item-btn qty-item-btn-decr"
                                disabled={product.quantity <= 1}
                                onClick={() =>
                                  updateQuantity(
                                    product.id,
                                    product.quantity - 1,
                                  )
                                }
                              >
                                <i className="fa-solid fa-minus" />
                              </button>
                              <input
                                type="number"
                                className="items-qty-input"
                                onChange={(e) =>
                                  updateQuantity(
                                    product.id,
                                    e.currentTarget.valueAsNumber,
                                  )
                                }
                                min={1}
                                max={MAX_CART_QUANTITY}
                                inputMode="numeric"
                                aria-label={`Quantity for ${product.title}`}
                                value={product.quantity}
                              />
                              <button
                                type="button"
                                aria-label={`Increase quantity for ${product.title}`}
                                className="qty-item-btn qty-item-btn-incr"
                                disabled={product.quantity >= MAX_CART_QUANTITY}
                                onClick={() =>
                                  updateQuantity(
                                    product.id,
                                    product.quantity + 1,
                                  )
                                }
                              >
                                <i className="fa-solid fa-plus" />
                              </button>
                            </div>
                            <ModalTriggerButton
                              openModalName="quickviewEditCartModal"
                              className="edit-btn"
                              type="button"
                              onClick={() => setActiveCartProduct(product)}
                            >
                              <i className="fa-regular fa-pen" /> Edit
                            </ModalTriggerButton>
                          </div>
                        </div>
                        <div className="close-btn">
                          <button
                            type="button"
                            aria-label={`Remove ${product.title} from cart`}
                            className="rbt-round-btn"
                            onClick={() => removeItem(product.id)}
                          >
                            <i className="fa-solid fa-xmark" />
                          </button>
                        </div>
                      </li>
                    );
                  })
                )}
              </ul>
              <div
                className="minicart-quick-access-area mt--24"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  className="single-quick-access rbt-note-btn"
                  onClick={() => setOpenTool((pre) => (pre == 1 ? -1 : 1))}
                >
                  <span className="icon">
                    <i className="fa-regular fa-pen" />
                  </span>
                  <span className="text">Note</span>
                </button>
                <span className="hr-sepator" />
                <button
                  type="button"
                  className="single-quick-access rbt-shipping-btn"
                  onClick={() => setOpenTool((pre) => (pre == 2 ? -1 : 2))}
                >
                  <span className="icon">
                    <i className="fa-regular fa-truck-fast" />
                  </span>
                  <span className="text">Shipping</span>
                </button>
                <span className="hr-sepator" />
                <button
                  type="button"
                  className="single-quick-access rbt-coupon-btn"
                  onClick={() => setOpenTool((pre) => (pre == 3 ? -1 : 3))}
                >
                  <span className="icon">
                    <i className="fa-regular fa-ticket" />
                  </span>
                  <span className="text">Coupon</span>
                </button>
              </div>
              <CartRecommendations
                enabled={hasOpened}
                amountToFreeShipping={amountToFreeShipping}
              />
            </nav>
          </div>
          <div className="rbt-minicart-footer">
            <hr className="mb--0 mt--16" />
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
            <hr className="mb--0" />
            <div className="rbt-cart-subttotal">
              <p>
                <strong>{shippingPending ? "Total before shipping" : "Total"}</strong>
              </p>
              <p className="price">{formatPrice(orderTotal)}</p>
            </div>
            {hasCartItems ? (
              <FreeShippingProgress subtotal={totalPrice} itemCount={totalCartItems} compact />
            ) : null}
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
                <Link href={`/cart`} className="share-btn">
                  <i className="fa-regular fa-pen mr--4" /> View Cart
                </Link>
                <ShareCartButton
                  className="share-btn"
                  disabled={!hasCartItems}
                >
                  <i className="fa-sharp fa-solid fa-link mr--4" /> Share Cart
                </ShareCartButton>
              </div>
            </div>
          </div>
        </div>
        <button
          type="button"
          className="rbt-close-inner-popup rbt-popup-close-btn"
          aria-label="Close cart modal"
          onClick={close}
        />

        <CartNotePopup
          isOpen={openTool === 1}
          onClose={() => setOpenTool(-1)}
        />

        <CartShippingPopup
          isOpen={openTool === 2}
          onClose={() => setOpenTool(-1)}
          selectedCity={selectedShippingCity}
          onCityChange={setSelectedShippingCity}
        />

        <CartCouponPopup
          isOpen={openTool === 3}
          onClose={() => setOpenTool(-1)}
        />
      </div>
    </>
  );
}
