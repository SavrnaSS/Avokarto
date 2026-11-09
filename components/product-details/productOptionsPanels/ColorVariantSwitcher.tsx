"use client";

import { useState } from "react";
import Tooltip from "@/components/common/ui/Tooltip";
import type { ColorVariant } from "@/types/product";

/**
 * Real replacement for the old ProductOptionsPanel2 (hardcoded "Black"/"Deep
 * Red" swatches that didn't affect anything). Driven entirely by
 * product.colorVariants, admin-managed via color-variants-field.tsx - each
 * variant's `color` is the CSS/hex swatch value and `src` is the gallery
 * image it should switch the main product gallery to, matching the
 * convention already used by ProductCard14 and the static demo catalogs.
 */
export default function ColorVariantSwitcher({
  colorVariants,
  onSelect,
}: {
  colorVariants: ColorVariant[];
  onSelect: (src: string | undefined) => void;
}) {
  const [selectedTooltip, setSelectedTooltip] = useState("");

  if (colorVariants.length === 0) {
    return null;
  }

  return (
    <>
      <div className="rbt-store-variation-controls" data-variation="grid-4">
        <div className="rbt-info-wrapper d-flex mt--24">
          <div className="prd-info-section">
            <div className="prd-id-text">
              <p className="text-bold rbt-variation-label">
                Color:{" "}
                <span className="rbt-text">
                  {selectedTooltip || "No Selection"}
                </span>
              </p>
              <div className="rbt-color-select-area">
                <ul className="rbt-switcher-root rbt-switcher-color-list rbt-switcher-color-list-lg product-switcher-activation">
                  {colorVariants.map((variant) => (
                    <li
                      key={variant.src}
                      className={
                        selectedTooltip === variant.tooltip ? "active" : ""
                      }
                    >
                      <Tooltip content={variant.tooltip} placement="top">
                        <button
                          type="button"
                          className="rbt-switcher--color tooltips"
                          onClick={() => {
                            setSelectedTooltip(variant.tooltip);
                            onSelect(variant.src);
                          }}
                          aria-label={`Select ${variant.tooltip}`}
                        >
                          <div
                            className="rbt-color-circle"
                            style={{ backgroundColor: variant.color }}
                          />
                        </button>
                      </Tooltip>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
      {selectedTooltip ? (
        <div className="rbt-store-reset-variations">
          <button
            type="button"
            className="rbt-reset-variation rbt-btn rbt-btn-black rbt-btn-xs mt--16 rbt-scroll-trigger fade_in animation-order-1"
            onClick={() => {
              setSelectedTooltip("");
              onSelect(undefined);
            }}
          >
            Reset All
          </button>
        </div>
      ) : null}
    </>
  );
}
