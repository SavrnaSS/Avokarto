"use client";

import dynamic from "next/dynamic";
import { useUiStore } from "@/context/uiStore";

const SearchPanelContent = dynamic(() => import("./SearchPanelContent"), {
  ssr: false,
  loading: () => <div className="wrapper" role="status">Loading search…</div>,
});

export default function SearchDropdown() {
  const searchOpen = useUiStore((state) => state.searchOpen);

  return (
    <div
      id="header-search-dropdown"
      role="dialog"
      aria-modal="false"
      aria-label="Product search panel"
      className={`rbt-search-dropdown rbt-search-dropdown-activation${searchOpen ? " active" : ""}`}
    >
      {searchOpen && <SearchPanelContent />}
    </div>
  );
}
