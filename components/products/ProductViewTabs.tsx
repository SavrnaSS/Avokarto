"use client";

import NavEffectTabs from "@/components/common/ui/NavEffectTabs";
import type { Dispatch } from "react";
import type { FilterAction, FilterState } from "@/types";
import { toggleInStock, toggleOnSale } from "../reducer/filterActions";

export type ProductViewTabId = "discounted" | "all" | "in-stocks";

export default function ProductViewTabs({
  state,
  dispatch,
  parentClassName = "rbt-product-nav-section rbt-product-nav-var-brand",
  groupClassName = "rbt-product-nav-grp rbt-product-nav-grp-sm",
  itemClassName = "rbt-product-nav",
  highlightClassName = "rbt-bg-highlight",
}: {
  state: Pick<FilterState, "activeFilterOnSale" | "activeFilterInStock">;
  dispatch: Dispatch<FilterAction>;
  parentClassName?: string;
  groupClassName?: string;
  itemClassName?: string;
  highlightClassName?: string;
}) {
  const active: ProductViewTabId = state.activeFilterOnSale
    ? "discounted"
    : state.activeFilterInStock
      ? "in-stocks"
      : "all";

  const setActive = (id: ProductViewTabId) => {
    if (id === "discounted") {
      if (!state.activeFilterOnSale) toggleOnSale(dispatch);
      if (state.activeFilterInStock) toggleInStock(dispatch);
      return;
    }

    if (id === "in-stocks") {
      if (!state.activeFilterInStock) toggleInStock(dispatch);
      if (state.activeFilterOnSale) toggleOnSale(dispatch);
      return;
    }

    // "all"
    if (state.activeFilterOnSale) toggleOnSale(dispatch);
    if (state.activeFilterInStock) toggleInStock(dispatch);
  };

  return (
    <NavEffectTabs
      parentClassName={parentClassName}
      groupClassName={groupClassName}
      itemClassName={itemClassName}
      highlightClassName={highlightClassName}
      options={[
        {
          id: "discounted",
          label: (
            <>
              <i className="fa-regular fa-tag mr--4" />
              Discounted
            </>
          ),
        },
        {
          id: "all",
          label: (
            <>
              <i className="fa-regular fa-border-all mr--4" /> All Together
            </>
          ),
        },
        {
          id: "in-stocks",
          label: (
            <>
              <i className="fa-regular fa-check-to-slot mr--4" />
              In stocks
            </>
          ),
        },
      ]}
      active={active}
      setActive={(id) => setActive(id as ProductViewTabId)}
    />
  );
}
