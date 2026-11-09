"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import { useUiStore } from "@/context/uiStore";

const SearchPanelContent = dynamic(() => import("./SearchPanelContent"), {
  ssr: false,
  loading: () => <div className="wrapper" role="status">Loading search…</div>,
});

export default function SearchDropdownCommon() {
  const commonSearchOpen = useUiStore((state) => state.commonSearchOpen);
  const closeCommonSearch = useUiStore((state) => state.closeCommonSearch);
  const pathname = usePathname();

  // Any navigation away from the current page (a trending product card, a
  // popular-search category pill, browser back/forward) should dismiss the
  // panel - otherwise it stays open, floating over whatever page the user
  // just landed on.
  useEffect(() => {
    closeCommonSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return (
    <div
      id="header-common-search-dropdown"
      // The wrapper is always in the DOM (hidden with CSS when closed), so
      // it's only a dialog - and only visible to assistive tech - while open.
      role={commonSearchOpen ? "dialog" : undefined}
      aria-modal={commonSearchOpen ? "false" : undefined}
      aria-label={commonSearchOpen ? "Search products" : undefined}
      aria-hidden={!commonSearchOpen}
      className={`rbt-search-dropdown rbt-common-search-dropdown-activation${commonSearchOpen ? " active" : ""}`}
    >
      {commonSearchOpen && <SearchPanelContent />}
    </div>
  );
}
