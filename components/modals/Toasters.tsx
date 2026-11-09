"use client";

import { CircleBorderIcon } from '../svg-icons';
import { useUiElement } from "@/context/uiStore";

export default function Toasters() {
  const { toasterCompareVisible, toasterWishlistVisible, wishlistMessage } = useUiElement();
  return (
    <>
      <div
        aria-hidden={!toasterCompareVisible}
        className={`rbt-toaster rbt-toaster-compare${toasterCompareVisible ? " is-visible" : ""}`}
        role="alert"
        aria-atomic="true"
        aria-live="assertive"
      >
        <i className="fa-regular fa-check mr--8" />
        Added in Compare
      </div>
      <div
        aria-hidden={!toasterWishlistVisible}
        className={`rbt-toaster rbt-toaster-wishlist${toasterWishlistVisible ? " is-visible" : ""}`}
        role="alert"
        aria-atomic="true"
        aria-live="assertive"
      >
        <i className="fa-regular fa-check mr--8" />
        {wishlistMessage}
      </div>
      <div className="rbt-progress-parent">
        <CircleBorderIcon />
      </div>
    </>
  );
}
