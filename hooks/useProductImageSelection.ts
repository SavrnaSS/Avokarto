"use client";

import { useCallback, useState } from "react";
import type { Product } from "@/types";

export function useProductImageSelection(product: Pick<Product, "id" | "imgSrc">) {
  const selectionKey = `${product.id}:${product.imgSrc}`;
  const [selectedByKey, setSelectedByKey] = useState<Record<string, string>>(
    {},
  );
  const selectedImage = selectedByKey[selectionKey] ?? product.imgSrc;

  const selectImage = useCallback(
    (src?: string | null) => {
      if (!src) return;

      setSelectedByKey((prev) =>
        prev[selectionKey] === src ? prev : { ...prev, [selectionKey]: src },
      );
    },
    [selectionKey],
  );

  return [selectedImage, selectImage] as const;
}
