"use client";

import { useMemo } from "react";
import { Product } from "@/types";

export default function FilterByTag({
  selectedItems,
  onChange,
  sourceProducts = [],
}: {
  selectedItems: string[];
  onChange: (value: string) => void;
  sourceProducts?: Product[];
}) {
  // Tags are admin free text (Products > edit > Tags / Product Badges), not
  // a fixed lookup table - the real list is whatever's actually attached to
  // a product in the catalog, derived here instead of a hardcoded set
  // ("best-color", "top-item", ...) that never matched any real tag value.
  const tags = useMemo(() => {
    const seen = new Set<string>();
    for (const product of sourceProducts) {
      for (const tag of product.tags ?? []) {
        const trimmed = tag.trim();
        if (trimmed) seen.add(trimmed);
      }
    }
    return [...seen].sort((a, b) => a.localeCompare(b));
  }, [sourceProducts]);

  const handleTagClick = (tag: string) => {
    onChange(tag);
  };

  if (!tags.length) {
    return null;
  }

  return (
    <>
      {tags.map((tag) => (
        <button
          type="button"
          key={tag}
          onClick={() => {
            handleTagClick(tag);
          }}
          className={selectedItems.includes(tag) ? "active" : ""}
        >
          {tag}
        </button>
      ))}
    </>
  );
}
