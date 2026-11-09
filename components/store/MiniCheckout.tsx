"use client";

import { FireIcon } from "../svg-icons";
import Image from "next/image";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { useContextElement } from "@/context/Context";
import ModalTriggerButton from "../action-buttons/ModalTriggerButton";
import ShareCartButton from "@/components/action-buttons/ShareCartButton";
import { getCartSummary } from "../../lib/cartSummaryUtils";
import { useStorePolicy } from "@/hooks/useStorePolicy";
import { getCartItemCount, getCartPricing } from "@/lib/cartQuantity";
import { useCurrency } from "@/lib/currency";
import { useCustomerSession } from "@/hooks/use-customer-session";
import CartBundleSavings from "@/components/store/CartBundleSavings";
import FreeShippingProgress from "@/components/store/FreeShippingProgress";
import styles from "./MiniCheckout.module.css";
import CartCatalogStatus from "./CartCatalogStatus";

const MAX_ORDER_SUMMARY_ITEMS = 3;

export default function MiniCheckout({
  shippingOverride,
}: {
  shippingOverride?: number;
} = {}) {
  const { cartProducts, totalPrice, mounted } = useContextElement();
  // Phones: the summary sits above the form, collapsed to one tappable bar
  // (see MiniCheckout.module.css) so the form stays in reach.
  const [open, setOpen] = useState(false);
  const customer = useCustomerSession((state) => state.customer);
  const { formatPrice } = useCurrency();
  const hasCartItems = cartProducts.length > 0;
  const totalCartItems = getCartItemCount(cartProducts);

  // Re-render when the admin's free-shipping rule loads or changes.

  useStorePolicy();

  const {
    subtotalLabel,
    shippingTotal,
    shippingPending,
    orderTotal,
  } = getCartSummary(totalPrice, totalCartItems, shippingOverride);

  const bundleSaving = getCartPricing(mounted ? cartProducts : []).discount;

  if (!mounted) {
    return (
      <div className={`rbt-sidebar-cart sticky-top ${styles.root}`} aria-busy="true">
        <div className="rbt-sidebar-widget">
          <div className="rbt-inner" role="status">
            <h5 className="title rbt-text-bold">Order summary</h5>
            <p className="mb--0">Loading your cart…</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`rbt-sidebar-cart sticky-top ${styles.root} ${open ? styles.open : ""}`}
    >
      <button
        type="button"
        className={styles.toggle}
        aria-expanded={open}
        aria-controls="order-summary-details"
        onClick={() => setOpen((value) => !value)}
      >
        <span className={styles.toggleLabel}>
          <i className="fa-regular fa-cart-shopping" aria-hidden="true" />
          {open ? "Hide" : "Show"} order summary
          <ChevronDown size={16} aria-hidden="true" className={styles.chevron} />
        </span>
        <span className={styles.toggleTotal}>
          <strong>{formatPrice(orderTotal)}</strong>
          {bundleSaving > 0.004 ? (
            <span className={styles.toggleSaving}>
              You save {formatPrice(bundleSaving)}
            </span>
          ) : null}
        </span>
      </button>
      <FreeShippingProgress
        subtotal={totalPrice}
        itemCount={totalCartItems}
        compact
        className="mt--12 mb--16"
      />
      <CartCatalogStatus />
      <div id="order-summary-details" className={styles.details}>
      {/* Start Single Widget */}
      <div className="rbt-sidebar-widget">
        <div className="rbt-inner">
          <div className="rbt-title-part d-flex mb--12 justify-content-between align-items-center">
            <h5 className="title mb--0 rbt-text-bold">Order summary</h5>
            <div className="rbt-link-hover">
              <Link href="/cart">Edit</Link>
            </div>
          </div>
          <div className="rbt-order-sum-area rbt-order-sum-area-sm align-items-center mb--16">
            <ModalTriggerButton
              openModalName="cartSidebar"
              className="ordered-items-wrapper rbt-order-sidenav-activation d-flex rbt-gap--12 align-items-center w-100 border-0 bg-transparent p-0 text-start"
              aria-label="Open cart"
            >
              {cartProducts.length === 0 ? (
                <p className="rbt-text-color-gray-600 mb--0 b2">
                  Your cart is empty.
                </p>
              ) : (
                <>
                  {cartProducts
                    .slice(0, MAX_ORDER_SUMMARY_ITEMS)
                    .map((product) => (
                      <span
                        key={product.id}
                        className="ordered-item ordered-item-01"
                      >
                        <Image
                          alt={product.title || "Product"}
                          src={
                            product.imgSrc ||
                            "/assets/images/catagory-img/cat-transp-img-07.webp"
                          }
                          width={93}
                          height={93}
                        />
                      </span>
                    ))}
                  {cartProducts.length > MAX_ORDER_SUMMARY_ITEMS && (
                    <span className="ordered-item more-icon ms-auto">
                      <i className="fa-solid fa-chevron-right" />
                    </span>
                  )}
                </>
              )}
            </ModalTriggerButton>
          </div>
          <CartBundleSavings subtotalLabel={subtotalLabel} />
          <div className="rbt-cart-subttotal">
            <p>Shipping</p>
            <p className="price">
              {shippingPending
                ? "Select a delivery method"
                : !hasCartItems
                  ? "—"
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
          <div className="rbt-minicart-bottom mt--24">
            <div className="share-btn-grp rbt-link-hover">
              <Link href="/cart" className="share-btn">
                <i className="fa-regular fa-pen mr--4" /> View Cart
              </Link>
              <ShareCartButton
                className="share-btn"
                disabled={!hasCartItems}
              >
                <i className="fa-sharp fa-solid fa-link mr--4" /> Share Cart
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
      {!customer ? (
        <div className="rbt-sidebar-widget rbt-sidebar-widget-sm mt--24">
          <div className="rbt-inner">
            <div className="rbt-quick-info-tag d-flex transparent">
              <FireIcon />
              <p className="rbt-link-hover b1">
                <ModalTriggerButton
                  openModalName="signinModal"
                  className="border-0 bg-transparent p-0 text-primary"
                >
                  Sign in
                </ModalTriggerButton>{" "}
                to track this order from your account.
              </p>
            </div>
          </div>
        </div>
      ) : null}
      {/* End Single Widget */}
      </div>
    </div>
  );
}
