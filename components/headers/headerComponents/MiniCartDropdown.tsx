"use client";

import Image from "next/image";
import Link from "next/link";
import { useContextElement } from "@/context/store";
import ShareCartButton from "@/components/action-buttons/ShareCartButton";
import { useCurrency } from "@/lib/currency";
import { getCartSummary } from "@/lib/cartSummaryUtils";
import { useStorePolicy } from "@/hooks/useStorePolicy";
import { getCartItemCount } from "@/lib/cartQuantity";
import { getProductDetailsHref } from "@/lib/productLinks";
import CartBundleSavings from "@/components/store/CartBundleSavings";
import FreeShippingProgress from "@/components/store/FreeShippingProgress";

export default function MiniCartDropdown() {
  const { cartProducts, totalPrice, setCartProducts } = useContextElement();
  const { formatPrice } = useCurrency();
  const totalCartItems = getCartItemCount(cartProducts);
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
    <div className="rbt-mini-cart-popup">
      <div className="rbt-mini-cart-inner">
        <div className="inner-top">
          <div className="content d-block">
            <div className="title-section">
              <h6 className="title mb--0">
                <i className="fa-sharp fa-regular fa-cart-shopping mr--12" />
                Your cart
              </h6>
            </div>
            <div className="rbt-btn-close">
              <button
                type="button"
                className="minicart-close-button rbt-round-btn"
                aria-label="Close mini cart"
              >
                <i className="fa-solid fa-xmark" />
              </button>
            </div>
          </div>
        </div>

        {cartProducts.length > 0 ? (
          <>
            <nav className="side-nav w-100">
              <ul className="rbt-minicart-wrapper">
                {cartProducts.map((item) => {
                  const productHref = getProductDetailsHref(item);

                  return (
                    <li className="minicart-item" key={item.id}>
                      <div className="thumbnail">
                        <Link href={productHref}>
                          <Image
                            alt={item.title || "Product Image"}
                            src={
                              item.imgSrc ||
                              "/assets/images/product-img/cart-product/cart-product-01.webp"
                            }
                            width={item.imgWidth || item.width || 142}
                            height={item.imgHeight || item.height || 100}
                          />
                        </Link>
                      </div>
                      <div className="product-content text-start">
                        <h6 className="title">
                          <Link href={productHref}>{item.title}</Link>
                        </h6>
                        <span className="quantity">
                          {item.quantity}x{" "}
                          <span className="price">
                            {formatPrice(item.price)}
                          </span>
                        </span>
                      </div>
                      <div className="close-btn">
                        <button
                          type="button"
                          aria-label={`Remove ${item.title} from cart`}
                          className="rbt-round-btn"
                          onClick={() =>
                            setCartProducts((prev) =>
                              prev.filter(
                                (product) =>
                                  String(product.id) !== String(item.id),
                              ),
                            )
                          }
                        >
                          <i className="fa-solid fa-xmark" />
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </nav>
            <div className="rbt-minicart-footer">
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
                <p className="subtotal">
                  <strong>{shippingPending ? "Total before shipping" : "Total"}</strong>
                </p>
                <p className="price">{formatPrice(orderTotal)}</p>
              </div>
              <FreeShippingProgress
                subtotal={totalPrice}
                itemCount={totalCartItems}
                compact
                className="text-start"
              />
              <div className="rbt-minicart-bottom mt--16">
                <div className="rbt-button-group">
                  <Link
                    href={`/cart`}
                    className="rbt-btn rbt-btn-sm rbt-btn-gray"
                  >
                    View Cart
                  </Link>
                  <Link
                    href="/checkout-shipping"
                    className="rbt-btn rbt-btn-sm"
                  >
                    <span className="btn-text">Checkout</span>
                  </Link>
                </div>
                <div className="share-btn-grp rbt-link-hover">
                  <ShareCartButton className="share-btn">
                    <i className="fa-sharp fa-solid fa-link mr--4" />
                    Share Cart
                  </ShareCartButton>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="rbt-minicart-footer">
            <div className="text-center p--20">
              <i
                className="fa-regular fa-bag-shopping mb--16"
                style={{ fontSize: "48px", opacity: 0.2 }}
              />
              <h6 className="mb--8">Your cart is empty</h6>
              <p className="description-text mb--24">
                Looks like you haven&apos;t added anything to your cart yet.
              </p>
              <Link href="/shop" className="rbt-btn rbt-btn-sm w-100">
                Go to Shop
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
