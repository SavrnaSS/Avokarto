"use client";

import { useMemo, useState } from "react";
import { Product } from "@/types";

export default function FilterByColor({
  selectedItems,
  onChange,
  getFilterCount,
  sourceProducts = [],
  scrollAble = false,
}: {
  selectedItems: string[];
  onChange: (value: string) => void;
  getFilterCount: (fn: (product: Product) => boolean) => number;
  sourceProducts?: Product[];
  scrollAble?: boolean;
}) {
  const [showMore, setShowMore] = useState(false);

  // Colors are admin free text (Products > edit > Color Swatches), not a
  // fixed lookup table like categories/brands - so "every color that
  // actually appears in the catalog" is the real list, derived here
  // instead of a hardcoded universal palette that drifts from reality.
  const colors = useMemo(() => {
    const seen = new Set<string>();
    for (const product of sourceProducts) {
      for (const color of product.filterColor ?? []) {
        const trimmed = color.trim();
        if (trimmed) seen.add(trimmed);
      }
    }
    return [...seen].sort((a, b) => a.localeCompare(b));
  }, [sourceProducts]);

  const handleToggle = (colorName: string) => {
    onChange(colorName);
  };

  if (!colors.length) {
    return null;
  }

  return (
    <div
      className={`${scrollAble ? "" : "rbt-has-show-more"} ${
        showMore ? "active" : ""
      }`}
    >
      <span className="rbt-filter-item-not-found rbt-text-color-danger">
        Color not matched
      </span>

      <ul className="rbt-sidebar-list-wrapper rbt-categories-list-color-swatch rbt-search-filter-item-list rbt-has-show-more-inner-content">
        {colors.map((color) => {
          const isActive = selectedItems.includes(color);

          return (
            <li key={color} className="rbt-color-swatch-group">
              <button
                type="button"
                onClick={() => handleToggle(color)}
                className={`rbt-color-swatch-content ${
                  isActive ? "active" : ""
                }`}
              >
                <span className="rbt-color-swatch">
                  {/* Free-text admin color name, not a fixed palette - CSS
                      resolves standard color keywords ("black", "navy", ...)
                      directly; anything else just falls back to no fill,
                      which still shows correctly via the text label. */}
                  <span
                    className="rbt-color-swatch-bg"
                    style={{ backgroundColor: color.toLowerCase() }}
                  />
                  <span className="rbt-color-swatch-text">{color}</span>
                </span>
              </button>

              <span className="rbt-color-swatch-count">
                ({getFilterCount((product) => !!product.filterColor?.includes(color))})
              </span>
            </li>
          );
        })}
      </ul>
      {!scrollAble ? (
        <div
          className={`rbt-show-more-btn-area ${showMore ? "active" : ""}`}
          onClick={() => setShowMore((prev) => !prev)}
        >
          <button type="button" className="rbt-show-more-btn">
            {showMore ? "Show Less" : "Show More"}
          </button>
        </div>
      ) : (
        ""
      )}
    </div>
  );
}
