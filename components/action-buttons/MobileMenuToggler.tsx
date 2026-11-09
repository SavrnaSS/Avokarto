"use client";

import ModalTriggerButton from "@/components/action-buttons/ModalTriggerButton";

export default function MobileMenuToggler({
  parentClass = "hamburger-button rbt-round-btn",
  ariaLabel = "Open mobile menu",
}: {
  parentClass?: string;
  ariaLabel?: string;
}) {
  return (
    <ModalTriggerButton
      openModalName="mobileMenu"
      className={parentClass}
      aria-label={ariaLabel}
      title={ariaLabel}
    >
      <i className="fa-solid fa-bars" />
    </ModalTriggerButton>
  );
}
