"use client";

import ModalTriggerButton from "@/components/action-buttons/ModalTriggerButton";
import { useUiElement } from "@/context/uiStore";
import type { MouseEventHandler, ReactNode } from "react";

type ShareCartButtonProps = {
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  onClick?: MouseEventHandler<HTMLElement>;
};

export default function ShareCartButton({
  children,
  className,
  disabled = false,
  onClick,
}: ShareCartButtonProps) {
  const { setSocialSharePath } = useUiElement();

  return (
    <ModalTriggerButton
      openModalName="socialShareModal"
      className={className}
      type="button"
      disabled={disabled}
      aria-disabled={disabled}
      onClick={(event) => {
        setSocialSharePath("/cart");
        onClick?.(event);
      }}
    >
      {children}
    </ModalTriggerButton>
  );
}
