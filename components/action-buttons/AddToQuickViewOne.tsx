"use client";

import { useStore } from "@/context/store";
import { Product } from "@/types";
import ModalTriggerButton from "@/components/action-buttons/ModalTriggerButton";
import type { MouseEventHandler } from "react";

interface AddToQuickViewProps {
  product: Product;
  children: React.ReactNode;
  onClick?: MouseEventHandler<HTMLElement>;
  openModalName?: "quickViewModal";
  [key: string]: unknown;
}

export default function AddToQuickViewOne({
  product,
  children,
  onClick,
  openModalName = "quickViewModal",
  ...rest
}: AddToQuickViewProps) {
  const setQuickViewItem = useStore((state) => state.setQuickViewItem);

  return (
    <ModalTriggerButton
      openModalName={openModalName}
      aria-label={`Quick view ${product.title}`}
      onClick={(event) => {
        if (product) {
          setQuickViewItem(product);
        }
        onClick?.(event);
      }}
      {...rest}
    >
      {children}
    </ModalTriggerButton>
  );
}
