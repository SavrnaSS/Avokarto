"use client";

import { useUiStore } from "@/context/uiStore";
import type {
  ButtonHTMLAttributes,
  HTMLAttributes,
  MouseEvent,
  MouseEventHandler,
  ReactNode,
} from "react";
import { type ModalNameType } from "@/types/modal";

interface ModalTriggerButtonProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "children" | "onClick" | "className"
> {
  as?: "button" | "div";
  openModalName: ModalNameType;
  children: ReactNode;
  className?: string;
  onClick?: MouseEventHandler<HTMLElement>;
  divProps?: Omit<
    HTMLAttributes<HTMLDivElement>,
    "children" | "onClick" | "className"
  >;
}

export default function ModalTriggerButton({
  as = "button",
  openModalName,
  children,
  className,
  onClick,
  divProps,
  ...rest
}: ModalTriggerButtonProps) {
  const openSpecificBsModal = useUiStore((state) => state.openSpecificBsModal);
  const sharedClassName = ["modal-trigger-button", className]
    .filter(Boolean)
    .join(" ");
  const handleClick = (e: MouseEvent<HTMLElement>) => {
    onClick?.(e);

    openSpecificBsModal(openModalName);
  };

  if (as === "div") {
    return (
      <div
        role="button"
        tabIndex={0}
        {...divProps}
        className={sharedClassName}
        onClick={handleClick}
      >
        {children}
      </div>
    );
  }

  return (
    <button
      type="button"
      {...rest}
      className={sharedClassName}
      onClick={handleClick}
    >
      {children}
    </button>
  );
}
