"use client";

import { useHydratedStore, useStore } from "@/context/store";
import { useUiStore } from "@/context/uiStore";
import type { Product } from "@/types";
import Tooltip from "@/components/common/ui/Tooltip";

interface AddToCompareProps {
  product: Product;
  tooltipDirection?: "top" | "right" | "bottom" | "left";
  parentClass?: string;
}

export default function AddToCompare2({
  product,
  tooltipDirection = "left",
  parentClass = "rbt-compare-btn rbt-quick-btn tooltips",
}: AddToCompareProps) {
  const addToCompareItem = useStore((state) => state.addToCompareItem);
  const removeFromCompareItem = useStore((state) => state.removeFromCompareItem);
  const showToasterCompare = useUiStore((state) => state.showToasterCompare);
  const showToaster = useUiStore((state) => state.showToaster);
  const isAdded = useHydratedStore(
    (state) => state.compareItem.some((item) => item.id == product.id),
    false,
  );

  const handleToggleCompare = () => {
    if (!product.id) return;
    if (isAdded) {
      removeFromCompareItem(product.id);
      showToaster("Removed from Compare");
    } else {
      addToCompareItem(product);
      showToasterCompare();
    }
  };

  return (
    <Tooltip
      content={isAdded ? "Remove From Compare" : "Add To Compare"}
      placement={tooltipDirection}
    >
      <button
        type="button"
        className={`${parentClass} ${isAdded ? "added-compare" : ""}`}
        onClick={(e) => {
          e.preventDefault();
          handleToggleCompare();
        }}
      >
        <i className="fa-regular fa-scale-balanced" />
      </button>
    </Tooltip>
  );
}
