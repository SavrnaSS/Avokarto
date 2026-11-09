"use client";

import { Product } from "@/types";
import { useLiveBrands } from "@/hooks/use-live-brands";

export default function FilterByBrand({
  selectedItems,
  onChange,
  getFilterCount,
}: {
  selectedItems: string[];
  onChange: (value: string) => void;
  getFilterCount: (fn: (product: Product) => boolean) => number;
}) {
  const { brands, loading, error, hasData } = useLiveBrands();

  // The parent renders this straight into a <ul> (see Sidebar.tsx), so
  // every branch has to be a valid direct child of <ul>.
  if (loading) {
    return <li className="rbt-check-group">Loading brands…</li>;
  }

  if (!hasData && error) {
    return <li className="rbt-check-group">Unable to load brands.</li>;
  }

  if (!brands.length) {
    return <li className="rbt-check-group">No brands are available yet.</li>;
  }

  return (
    <>
      {brands.map((brand) => {
        const isActive = selectedItems.includes(brand.name);
        const inputId = `brand-checkbox-${brand.slug}`;

        return (
          <li
            key={brand.slug}
            className={`rbt-check-group ${isActive ? "active" : ""}`}
          >
            <input
              id={inputId}
              type="checkbox"
              name="brand"
              checked={isActive}
              onChange={() => onChange(brand.name)}
            />
            <label htmlFor={inputId}>
              <span className="rbt-label-content">
                <span
                  className="rbt-label-img"
                  style={{
                    display: "grid",
                    placeItems: "center",
                    background: "var(--color-gray-light)",
                    color: "var(--color-heading)",
                    fontWeight: 600,
                    fontSize: "12px",
                  }}
                >
                  {brand.initials}
                </span>
                <span className="rbt-label-text">{brand.name}</span>
              </span>
              <span className="rbt-label-count">
                (
                {getFilterCount(
                  (product) =>
                    !!product.filterBrands?.includes(brand.name),
                )}
                )
              </span>
            </label>
          </li>
        );
      })}
    </>
  );
}
