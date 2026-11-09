"use client";

import ModalTriggerButton from "@/components/action-buttons/ModalTriggerButton";

export default function CartSidebarToggler({
  children,
  onClick,
  ...props
}: {
  children: React.ReactNode;
  onClick?: (event: React.MouseEvent<HTMLElement>) => void;
  [key: string]: unknown;
}) {
  return (
    <ModalTriggerButton
      as="div"
      {...props}
      openModalName="cartSidebar"
      onClick={onClick}
    >
      {children}
    </ModalTriggerButton>
  );
}
