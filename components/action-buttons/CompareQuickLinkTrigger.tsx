"use client";

import ModalTriggerButton from "@/components/action-buttons/ModalTriggerButton";
import { useContextElement } from "@/context/Context";
import type { Product } from "@/types";

interface CompareQuickLinkTriggerProps {
  product: Product;
  parentClass?: string;
}

export default function CompareQuickLinkTrigger({
  product,
  parentClass = "rbt-quick-link",
}: CompareQuickLinkTriggerProps) {
  const { addToCompareItem, isAddedToCompareItem, removeFromCompareItem } =
    useContextElement();

  const isCompared = isAddedToCompareItem(product.id);

  if (isCompared) {
    return (
      <button
        type="button"
        className={parentClass}
        onClick={() => removeFromCompareItem(product.id)}
      >
        <i className="fa-sharp fa-regular fa-copy" />
        Remove From Compare
      </button>
    );
  }

  return (
    <ModalTriggerButton
      openModalName="compareReviewModal"
      className={parentClass}
      onClick={() => addToCompareItem(product)}
    >
      <i className="fa-sharp fa-regular fa-copy" />
      Compare Product
    </ModalTriggerButton>
  );
}
