"use client";

import { useContextElement, useUiElement } from "@/context/Context";
import type { Product } from "@/types";
import Tooltip from "../common/ui/Tooltip";

interface AddToWishlistProps {
  product: Product;
  parentClass?: string;
}

export default function AddToWishlist({
  parentClass = "rbt-wishlist-btn rbt-quick-btn",
  product,
}: AddToWishlistProps) {
  const { addToWishlist, isAddedtoWishlist } = useContextElement();
  const { showToaster } = useUiElement();

  const isWishlisted = isAddedtoWishlist(product.id);

  const tooltipText = isWishlisted ? "Remove Wishlist" : "Add To Wishlist";
  const iconClass = isWishlisted
    ? "fa-sharp fa-solid fa-heart"
    : "fa-regular fa-heart";

  const handleClick: React.MouseEventHandler<HTMLButtonElement> = (e) => {
    e.preventDefault();
    if (!product.id) return;
    addToWishlist(product);
    const message = isWishlisted
      ? "Removed from Wishlist"
      : "Added to Wishlist";
    showToaster(message);
  };

  return (
    <Tooltip content={tooltipText} placement="left">
      <button
        className={`${parentClass} ${isWishlisted ? "added-wishlist" : ""}`}
        type="button"
        aria-label={tooltipText}
        onClick={handleClick}
      >
        <i className={iconClass} />
      </button>
    </Tooltip>
  );
}
