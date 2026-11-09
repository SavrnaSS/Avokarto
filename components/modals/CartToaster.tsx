"use client";

import { useUiElement, useContextElement } from "@/context/Context";
import Link from "next/link";

export default function CartToaster() {
  const { cartToasterVisible, closeCartToaster } = useUiElement();
  const { cartProducts } = useContextElement();

  const lastAddedProduct = cartProducts[cartProducts.length - 1];

  if (!lastAddedProduct) return null;

  return (
    <div
      className={`rbt-toaster-style-2 rbt-toaster-activation ${
        cartToasterVisible ? "isVisible" : ""
      } `}
    >
      <div className="rbt-innter">
        <button
          type="button"
          className="rbt-close-btn close-toaster"
          onClick={closeCartToaster}
          aria-label="Close cart notification"
        >
          <i className="fa-sharp fa-solid fa-xmark" />
        </button>
        <p className="b3 mb--8 rbt-text-color-gray-100">
          &quot;{lastAddedProduct.title}&quot; has been added to cart
        </p>
        <Link
          href="/cart"
          className="rbt-underline-btn btn-white border-bottom border-1"
        >
          View Cart
          <i className="fa-regular fa-chevron-right" />
        </Link>
      </div>
    </div>
  );
}
