"use client";

import { useId } from "react";
import type { Product } from "@/types";
import { useLiveCategories } from "@/hooks/use-live-categories";

export default function FilterByCategories({
  selectedItems,
  onChange,
}: {
  selectedItems: string[];
  onChange: (value: string) => void;
  getFilterCount: (fn: (product: Product) => boolean) => number;
}) {
  const { categories, loading, error, hasData, refresh } = useLiveCategories();
  const idPrefix = useId();

  // The parent renders this straight into a <ul> (see Sidebar.tsx), so every
  // branch here has to be a valid direct child of <ul> - plain <li> rows,
  // not the generic DataBoundary's <div>-based skeleton/error states.
  if (loading) {
    return <li className="rbt-check-group">Loading categories…</li>;
  }

  if (!hasData && error) {
    return <li className="rbt-check-group">Unable to load categories. <button type="button" onClick={refresh}>Try again</button></li>;
  }

  if (!categories.length) {
    return <li className="rbt-check-group">No categories available yet.</li>;
  }

  return (
    <>
      {categories.map((category) => {
        const isChecked = selectedItems.some((name) => name.trim().toLowerCase() === category.name.trim().toLowerCase());
        const inputId = `${idPrefix}-category-${category.id}`;

        return (
          <li
            key={category.id}
            className={`rbt-check-group ${isChecked ? "active" : ""}`}
          >
            <input
              id={inputId}
              type="checkbox"
              name="category"
              checked={isChecked}
              onChange={() => onChange(category.name)}
            />
            <label htmlFor={inputId}>
              <span className="rbt-label-content">
                <span className="rbt-label-text">{category.name}</span>
                <span className="rbt-label-count">
                  ({category.count})
                </span>
              </span>
            </label>
          </li>
        );
      })}
    </>
  );
}
