"use client";

import { useUiStore } from "@/context/uiStore";
import { useEffect } from "react";

export default function SearchToggler() {
  const searchOpen = useUiStore((state) => state.searchOpen);
  const toggleSearch = useUiStore((state) => state.toggleSearch);
  const setMenuHoverOpen = useUiStore((state) => state.setMenuHoverOpen);
  const closeSearch = useUiStore((state) => state.closeSearch);
  useEffect(() => {
    if (!searchOpen) return;
    window.addEventListener("scroll", closeSearch, { passive: true, once: true });
    return () => window.removeEventListener("scroll", closeSearch);
  }, [searchOpen, closeSearch]);
  return (
    <button
      type="button"
      className={`search-trigger-active rbt-round-btn rbt-modern-close-btn${searchOpen ? " open" : ""}`}
      aria-label="Toggle search panel"
      aria-expanded={searchOpen}
      aria-controls="header-search-dropdown"
      onClick={(e) => {
        e.preventDefault();
        setMenuHoverOpen(false);
        toggleSearch();
      }}
    >
      <i className="fa-regular fa-search search-icon" />
      <div className="modern-close-wrapper" />
    </button>
  );
}
