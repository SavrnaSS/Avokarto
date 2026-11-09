"use client";

import { useUiStore } from "@/context/uiStore";
import { useEffect } from "react";

export default function CommonSearchToggler() {
  const commonSearchOpen = useUiStore((state) => state.commonSearchOpen);
  const toggleCommonSearch = useUiStore((state) => state.toggleCommonSearch);
  const setMenuHoverOpen = useUiStore((state) => state.setMenuHoverOpen);
  const closeCommonSearch = useUiStore((state) => state.closeCommonSearch);
  useEffect(() => {
    if (!commonSearchOpen) return;
    window.addEventListener("scroll", closeCommonSearch, { passive: true, once: true });
    return () => window.removeEventListener("scroll", closeCommonSearch);
  }, [commonSearchOpen, closeCommonSearch]);
  return (
    <button
      type="button"
      className={`rbt-round-btn has-rbt-md-fsize rbt-common-search-trigger-active rbt-modern-close-btn${commonSearchOpen ? " open" : ""}`}
      aria-label="Toggle sticky header search panel"
      aria-expanded={commonSearchOpen}
      aria-controls="header-common-search-dropdown"
      onClick={(e) => {
        e.preventDefault();
        setMenuHoverOpen(false);
        toggleCommonSearch();
      }}
    >
      <i className="fa-regular fa-search search-icon" />
      <div className="modern-close-wrapper" />
    </button>
  );
}
