"use client";
import { CheckmarkIcon } from "../svg-icons";
import Image from "next/image";
import Link from "next/link";
import { useContextElement } from "@/context/Context";
import { useManagedModalPanel } from "@/hooks/useManagedModalPanel";
import { fashionShopProducts } from "@/data/products/fashion";
import { getCartItemCount } from "@/lib/cartQuantity";
import { getProductDetailsHref } from "@/lib/productLinks";
import { Scrollbar } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import { useCurrency } from "@/lib/currency";

export default function AddedCart() {
  const { cartProducts, totalPrice } = useContextElement();
  const { close } = useManagedModalPanel("addedCartModal");
  const { formatPrice } = useCurrency();

  const lastItem =
    cartProducts.length > 0 ? cartProducts[cartProducts.length - 1] : undefined;
  const lastItemHref = getProductDetailsHref(lastItem);
  const totalItems = getCartItemCount(cartProducts);

  return (
    <div
      className="rbt-default-modal modal fade"
      id="addedCartModal"
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-label="Added to cart"
    >
      <div className="modal-dialog modal-dialog-centered xs-size">
        <div className="modal-content p--24">
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
          <div className="rbt-wishlist-added-wrapper">
            <div className="rbt-quick-info-tag d-inline-flex w-100">
              <CheckmarkIcon />
              <p>
                <strong>Product has been successfully added</strong>
              </p>
            </div>
            <div className="row row--16">
              <div className="col-md-6 col-12 mt--16">
                {lastItem ? (
                  <div className="rbt-card rbt-product-card">
                    <div className="rbt-card-img rbt-rounded--8">
                      <Link href={lastItemHref}>
                        <Image
                          alt={lastItem.title}
                          src={
                            lastItem.imgSrc ||
                            "/assets/images/product-img/cart-product/cart-product-01-lg.webp"
                          }
                          width={644}
                          height={493}
                        />
                      </Link>
                    </div>
                    <div className="rbt-card-body">
                      <h6 className="rbt-title mb--0 b1">
                        <Link href={lastItemHref}>
                          {lastItem.title}
                        </Link>
                      </h6>
                      <div className="pricing-part mt--0">
                        <span className="price-text">
                          {formatPrice(lastItem.price)}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="b1 mb--0">Your cart is currently empty.</p>
                )}
              </div>
              <div className="col-md-6 col-12 mt--16">
                <div className="rbt-cart-info text-center">
                  <p className="cart-quantity-text b1 rbt-text-color-heading mb--0">
                    There are <span className="number">{totalItems}</span> items
                    in your cart
                  </p>
                  <div className="pricing-part justify-content-center align-items-center">
                    <p className="b3 rbt-text-color-heading rbt-text-medium mb--0">
                      Total:
                    </p>
                    <span className="price-text rbt-text-color-primary h4 mb--0">
                      {formatPrice(totalPrice ?? 0)}
                    </span>
                  </div>

                  {lastItem ? (
                    <Link
                      className="rbt-btn rbt-btn-sm d-block mt--16"
                      href="/checkout-shipping"
                    >
                      Checkout
                    </Link>
                  ) : (
                    <button
                      type="button"
                      className="rbt-btn rbt-btn-sm d-block mt--16 disabled"
                      disabled
                    >
                      Checkout
                    </button>
                  )}
                  <Link
                    className="rbt-btn rbt-btn-sm d-block rbt-btn-naked b3 text-decoration-underline mt--8 rbt-text-semi-bold"
                    href={`/cart`}
                  >
                    View My Cart
                  </Link>
                  <Link
                    className="rbt-btn rbt-btn-sm d-block rbt-btn-naked b3 text-decoration-underline mt--8 rbt-text-semi-bold"
                    href={`/shop`}
                  >
                    Continue Shopping
                  </Link>
                </div>
              </div>
            </div>
            <hr className="rbt-separator rbt-separator-gray200 mt--16 mb--16" />
            <div className="rbt-rec-prd-section">
              <h6 className="rbt-title">Recommended Products</h6>
              <Swiper
                {...{
                  slidesPerView: 2,
                  spaceBetween: 24,
                  scrollbar: {
                    el: ".rbt-rec-prd-pagination",
                    draggable: true,
                  },
                  breakpoints: {
                    320: {
                      slidesPerView: 1,
                    },
                    600: {
                      slidesPerView: 2,
                    },
                  },
                }}
                className="swiper rbt-rec-prd-swiper rbt-swiper-scrollbar-bottom"
                modules={[Scrollbar]}
              >
                {fashionShopProducts.slice(2, 5).map((product) => {
                  const productHref = getProductDetailsHref(product);

                  return (
                    <SwiperSlide key={product.id} className="swiper-slide">
                    <div className="rbt-card rbt-product-card rbt-list-view-variation list-view-md">
                      <div className="inner">
                        <div className="rbt-card-img rbt-bg-color-default">
                          <Link href={productHref}>
                            <Image
                              alt="Card Image"
                              src={product.imgSrc}
                              width={1246}
                              height={976}
                            />
                          </Link>
                        </div>
                        <div className="rbt-card-body p-0">
                          <Link
                            href="/shop-by-category"
                            className="rbt-card-subtitle rbt-card-categories-text"
                          >
                            {product.category?.join(", ")}
                          </Link>
                          <h6 className="rbt-card-title mt--0 b4">
                            <Link href={productHref}>{product.title}</Link>
                          </h6>
                          <div className="pricing-part mt--0">
                            <span className="price-text">
                              {formatPrice(product.price)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    </SwiperSlide>
                  );
                })}

                <div className="rbt-swiper-scrollbar swiper-scrollbar rbt-rec-prd-pagination" />
              </Swiper>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
