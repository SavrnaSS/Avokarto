"use client";

import ModalTriggerButton from "@/components/action-buttons/ModalTriggerButton";
import { useContextElement } from "@/context/Context";
import type { Product } from "@/types";

interface WishlistQuickLinkTriggerProps {
  product: Product;
  parentClass?: string;
}

export default function WishlistQuickLinkTrigger({
  product,
  parentClass = "rbt-quick-link",
}: WishlistQuickLinkTriggerProps) {
  const { addToWishlist, isAddedtoWishlist } = useContextElement();

  const isWishlisted = isAddedtoWishlist(product.id);

  if (isWishlisted) {
    return (
      <button
        type="button"
        className={parentClass}
        onClick={() => addToWishlist(product)}
      >
        <i className="fa-sharp fa-regular fa-heart" />
        Remove wishlist
      </button>
    );
  }

  return (
    <ModalTriggerButton
      openModalName="wishlistModal"
      className={parentClass}
      onClick={() => addToWishlist(product)}
    >
      <i className="fa-sharp fa-regular fa-heart" />
      Add To Wishlist
    </ModalTriggerButton>
  );
}
