"use client";

import { useHydratedStore, useStore } from "@/context/store";
import { Product } from "@/types";
import ModalTriggerButton from "@/components/action-buttons/ModalTriggerButton";
import { withProductDetailsPageUrl } from "@/lib/productLinks";
import { isProductOutOfStock } from "@/lib/cartQuantity";

interface AddToCartProps {
  parentClass?: string;
  product: Product;
  detailsPageUrl?: string;
}

export default function AddToCart({
  parentClass = "rbt-btn rbt-btn-sm has-left-icon rbt-cart-sidenav-activation",
  product,
  detailsPageUrl,
}: AddToCartProps) {
  const addProductToCart = useStore((state) => state.addProductToCart);
  const isAdded = useHydratedStore(
    (state) => state.cartProducts.some((item) => String(item.id) === String(product.id)),
    false,
  );
  const isOutOfStock = isProductOutOfStock(product);

  if (isOutOfStock) {
    return (
      <button
        type="button"
        className={parentClass}
        disabled
        aria-disabled="true"
      >
        Out of Stock
      </button>
    );
  }

  if (isAdded) {
    return (
      <button
        type="button"
        className={parentClass}
        disabled
        aria-disabled="true"
      >
        <i className="fa-regular fa-cart-shopping mr--4" /> Already Added
      </button>
    );
  }

  return (
    <ModalTriggerButton
      openModalName="cartSidebar"
      className={parentClass}
      onClick={() => {
        addProductToCart(withProductDetailsPageUrl(product, detailsPageUrl));
      }}
    >
      <i className="fa-regular fa-cart-shopping mr--4" /> Add To Cart
    </ModalTriggerButton>
  );
}
