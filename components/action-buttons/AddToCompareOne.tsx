"use client";

import { useContextElement } from "@/context/Context";
import type { Product } from "@/types";
import ModalTriggerButton from "@/components/action-buttons/ModalTriggerButton";

interface AddToCompareProps {
  product: Product;
  parentClass?: string;
}

export default function AddToCompareOne({
  product,
  parentClass = "rbt-btn rbt-btn-border rbt-btn-sm rbt-square-btn d-block rbt-btn-transparent has-left-icon rbt-compare-btn-activation rbt-compare-bottom-sidenav-activation",
}: AddToCompareProps) {
  const { addToCompareItem, isAddedToCompareItem } = useContextElement();

  const isAdded = isAddedToCompareItem(product.id);

  if (isAdded) {
    return (
      <button type="button" className={parentClass}>
        <i className="fa-regular fa-file-plus-minus" />
        Already Compared
      </button>
    );
  }

  return (
    <ModalTriggerButton
      openModalName="comparePanel"
      className={parentClass}
      onClick={() => {
        if (product.id) {
          addToCompareItem(product);
        }
      }}
    >
      <i className="fa-regular fa-file-plus-minus" />
      Add To Compare
    </ModalTriggerButton>
  );
}
