"use client";

import Image from "next/image";
import Link from "next/link";
import { useContextElement } from "@/context/Context";
import Tooltip from "@/components/common/ui/Tooltip";
import { useCopyToClipboard } from "@/hooks/useCopyToClipboard";
import { usePathname } from "next/navigation";
import { useCurrency } from "@/lib/currency";

export default function Wishlist() {
  const { formatPrice } = useCurrency();
  const {
    wishList,
    removeFromWishlist,
    addProductToCart,
    isAddedToCartProducts,
    mounted,
  } = useContextElement();
  const { copied, copy } = useCopyToClipboard();

  const pathname = usePathname();
  const currentUrl =
    typeof window !== "undefined" ? `${window.location.origin}${pathname}` : "";

  const wishlistProducts = wishList;

  return (
    <div className="rbt-profile-content-area rbt-scrollable-content">
      <div className="rbt-component-section-title rbt-gap--4 mb--24 p-0 border-0 text-center">
        <h2 className="rbt-title mb--8">
          <span className="rbt-text-bold">Wishlist</span>
        </h2>
        <p className="description mx-auto">
          Explore and manage your favorite products in one place. Add items to
          your cart or share your wishlist with friends and family.
        </p>
      </div>
      <div className="rbt-transparent-table-one-wrapper pt--0 pb--0 mb--0">
        <table className="rbt-transparent-table-one rbt-wishlist-table mb--0">
          <tbody>
            {mounted && wishlistProducts.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-5">
                  <p className="rbt-text-color-gray-600 mb--0">
                    Your wishlist is empty.
                  </p>
                  <Link
                    href="/shop"
                    className="rbt-btn rbt-btn-md rbt-btn-primary mt--16"
                  >
                    Browse Products
                  </Link>
                </td>
              </tr>
            ) : (
              mounted &&
              wishlistProducts.map((product) => {
                const inCart = mounted && isAddedToCartProducts(product.id);
                return (
                  <tr key={product.id}>
                    <td className="rbt-product-remove-btn-wrapper">
                      <Tooltip content="Remove" placement="top">
                        <button
                          className="rbt-product-remove-btn rbt-round-btn tooltips"
                          type="button"
                          onClick={() => removeFromWishlist(product.id)}
                        >
                          <span>
                            <i className="fa-solid fa-xmark" />
                          </span>
                        </button>
                      </Tooltip>
                    </td>
                    <td className="product-thumbnail">
                      <Link href={`/product/${product.slug ?? product.id}`}>
                        <Image
                          alt={product.title || "Product image"}
                          src={
                            product.imgSrc ||
                            "/assets/images/wishlist/wishlist-prd-1.webp"
                          }
                          width={278}
                          height={212}
                        />
                      </Link>
                    </td>
                    <td className="rbt-wish-product-info">
                      <h6 className="rbt-wish-product-name">
                        <Link href={`/product/${product.slug ?? product.id}`}>
                          {product.title}
                        </Link>
                      </h6>
                      <div className="rbt-product-price-text rbt-text-color-primary">
                        <span>{formatPrice(product.price)}</span>
                      </div>
                      <span className="rbt-product-id">
                        <span className="rbt-text-semi-bold">SKU:</span>#
                        {product.id}
                      </span>
                    </td>
                    <td className="rbt-product-stock-status">
                      <div className="rbt-product-badge rbt-product-badge-bg-light-green border-rounded">
                        IN STOCK
                      </div>
                    </td>
                    <td>
                      <div className="rbt-button-group">
                        <button
                          type="button"
                          className="rbt-btn rbt-btn-sm has-left-icon"
                          onClick={() => {
                            if (!inCart) addProductToCart(product);
                          }}
                          disabled={inCart}
                        >
                          <i className="fa-regular fa-cart-shopping mr--4" />
                          {inCart ? "In Cart" : "Add To Cart"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      <hr className="mb--24" />
      <div className="rbt-wishlist-bottom-area">
        <div className="rbt-social-share-area">
          <p className="title mb--0 mr--24 mr_sm--0">Share on :</p>
          <ul className="rbt-social-icon-list mt_md--0 mt_sm--0">
            <li>
              <a
                href="https://twitter.com/"
                target="_blank"
                rel="noopener noreferrer"
              >
                <i className="fa-brands fa-twitter" />
              </a>
            </li>
            <li>
              <a
                href="https://www.youtube.com/"
                target="_blank"
                rel="noopener noreferrer"
              >
                <i className="fa-brands fa-youtube" />
              </a>
            </li>
            <li>
              <a
                href="https://www.facebook.com/"
                target="_blank"
                rel="noopener noreferrer"
              >
                <i className="fa-brands fa-facebook" />
              </a>
            </li>
            <li>
              <a
                href="https://wa.me/"
                target="_blank"
                rel="noopener noreferrer"
              >
                <i className="fa-brands fa-whatsapp" />
              </a>
            </li>
            <li>
              <a
                href="https://www.instagram.com/"
                target="_blank"
                rel="noopener noreferrer"
              >
                <i className="fa-brands fa-instagram" />
              </a>
            </li>
            <li>
              <a href="https://t.me/" target="_blank" rel="noopener noreferrer">
                <i className="fa-brands fa-telegram" />
              </a>
            </li>
          </ul>
        </div>
        <div className="rbt-copy-link-part rbt-text-copy-activation">
          <span className="rbt-copy-link-title">Wishlist link:</span>
          <input
            className="rbt-copy-value-field"
            type="text"
            value={currentUrl}
            readOnly={true}
          />
          <Tooltip content="Copy to clipboard" placement="top">
            <button
              className="rbt-btn rbt-btn-xs has-left-icon rbt-copy-btn"
              onClick={() => copy(currentUrl)}
              type="button"
            >
              <i className="fa-regular fa-copy" />
              <span className="rbt-btn-text ml--4">
                {copied ? "Copied!" : "Copy"}
              </span>
            </button>
          </Tooltip>
        </div>
      </div>
    </div>
  );
}
