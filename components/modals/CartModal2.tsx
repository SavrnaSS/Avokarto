"use client";
import { CloseIcon, FireSolidIcon } from "../svg-icons";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useContextElement } from "@/context/Context";
import { useManagedModalPanel } from "@/hooks/useManagedModalPanel";

import CartNotePopup from "./cart/CartNotePopup";
import CartShippingPopup from "./cart/CartShippingPopup";
import CartCouponPopup from "./cart/CartCouponPopup";
import ModalTriggerButton from "@/components/action-buttons/ModalTriggerButton";
import ShareCartButton from "@/components/action-buttons/ShareCartButton";
import { getCartSummary } from "@/lib/cartSummaryUtils";
import { useStorePolicy } from "@/hooks/useStorePolicy";
import { getCartItemCount, MAX_CART_QUANTITY } from "@/lib/cartQuantity";
import { getProductDetailsHref } from "@/lib/productLinks";
import { useCartReservationTimer } from "@/hooks/useCartReservationTimer";
import FreeShippingProgress from "@/components/store/FreeShippingProgress";
import { useCurrency } from "@/lib/currency";

export default function CartModal2() {
  const { formatPrice } = useCurrency();
  const [openTool, setOpenTool] = useState(-1);
  const [selectedShippingCity, setSelectedShippingCity] =
    useState("Select your City");
  const {
    cartProducts,
    totalPrice,
    setCartProducts,
    setActiveCartProduct,
    updateQuantity,
  } = useContextElement();
  const { close } = useManagedModalPanel("popup-cartModal");

  const hasCartItems = cartProducts.length > 0;
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
  } = getCartSummary(totalPrice, totalCartItems);

  return (
    <div
      className="rbt-default-modal has-rbt-top-folder-shape modal fade"
      id="popup-cartModal"
      tabIndex={-1}
      aria-labelledby="popup-cartModalLabel"
      role="dialog"
      aria-modal="true"
    >
      <div className="modal-dialog modal-dialog-centered xxs-size">
        <div className="modal-content">
          <div className="rbt-folder-shape-right-portion">
            <CloseIcon />
          </div>
          <div className="modal-header">
            <button
              type="button"
              className="rbt-round-btn rbt-modal-dis-btn"
              aria-label="Close"
              onClick={close}
            >
              <i className="fa-solid fa-xmark" />
            </button>
          </div>
          <div className="rbt-modal-cart rbt-top-folder-shape-wrapper rbt-sidebar-cart">
            <div className="overflow-hidden position-relative rbt-content-trs-portion">
              <div className="inner-wrapper">
                <div className="inner-top">
                  <div className="rbt-cart-header">
                    <div className="title-section">
                      <h6 className="title mb--0" id="popup-cartModalLabel">
                        <i className="fa-sharp fa-regular fa-cart-shopping mr--12" />
                        Your cart
                      </h6>
                    </div>
                    {hasCartItems && (
                      <div className="rbt-quick-info-tag d-flex mt--16 rbt-flash-animation">
                        <FireSolidIcon />
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
                  <nav className="side-nav w-100">
                    <ul className="rbt-minicart-wrapper">
                      {cartProducts.length === 0 ? (
                        <li className="minicart-item">
                          <div className="product-content text-center w-100 py-4">
                            <h6 className=" mb--8">Your cart is empty</h6>
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
                                  <Link href={productHref}>
                                    {product.title}
                                  </Link>
                                </h6>
                                <span className="quantity">
                                  {product.quantity}x{" "}
                                  <span className="price">
                                    {formatPrice(product.price)}
                                  </span>
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
                                      disabled={
                                        product.quantity >= MAX_CART_QUANTITY
                                      }
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
                                    className="edit-btn"
                                    type="button"
                                    openModalName="quickviewEditCartModal"
                                    onClick={() =>
                                      setActiveCartProduct(product)
                                    }
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
                  </nav>
                </div>
                <div className="rbt-minicart-footer mt--16">
                  <div className="minicart-quick-access-area">
                    <button
                      type="button"
                      className="single-quick-access rbt-note-btn"
                      onClick={() => setOpenTool((pre) => (pre == 1 ? -1 : 1))}
                      aria-expanded={openTool === 1}
                      aria-controls="cart-note-popup"
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
                      aria-expanded={openTool === 2}
                      aria-controls="cart-shipping-popup"
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
                      aria-expanded={openTool === 3}
                      aria-controls="cart-coupon-popup"
                    >
                      <span className="icon">
                        <i className="fa-regular fa-ticket" />
                      </span>
                      <span className="text">Coupon</span>
                    </button>
                  </div>
                  <hr className="mb--0 mt--16" />
                  <div className="rbt-cart-subttotal">
                    <p>Subtotal ({subtotalLabel})</p>
                    <p className="price">{formatPrice(totalPrice)}</p>
                  </div>
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
                    <p className="subtotal">
                      <strong>{shippingPending ? "Total before shipping" : "Total"}</strong>
                    </p>
                    <p className="price">{formatPrice(orderTotal)}</p>
                  </div>
                  <FreeShippingProgress subtotal={totalPrice} itemCount={totalCartItems} compact />
                  <div className="rbt-minicart-bottom mt--24">
                    <div className="checkout-btn mt--20">
                      {hasCartItems ? (
                        <Link
                          href="/checkout-shipping"
                          className="rbt-btn w-100 text-center"
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
                        <i className="fa-sharp fa-solid fa-link mr--4" /> Share
                        Cart
                      </ShareCartButton>
                    </div>
                  </div>
                </div>
              </div>

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
          </div>
        </div>
      </div>
    </div>
  );
}
