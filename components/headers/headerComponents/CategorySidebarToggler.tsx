"use client";

import ModalTriggerButton from "@/components/action-buttons/ModalTriggerButton";

export default function CategorySidebarToggler({
  parentClass = "rbt-offcanvas-trigger-btn rbt-cat-offcanvas-activation rbt-burger-menu-bar",
}) {
  return (
    <ModalTriggerButton
      as="div"
      openModalName="categorySidebar"
      className={parentClass}
      onClick={() => {
        // e.preventDefault();
      }}
    >
      <div className="rbt-burger-menu-bar-wrapper">
        <i className="rbt-line-btn">
          <span className="rbt-lines" />
        </i>
        <i className="rbt-line-btn rbt-hover-effect">
          <span className="rbt-lines" />
        </i>
      </div>
    </ModalTriggerButton>
  );
}
