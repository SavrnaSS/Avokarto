"use client";

import dynamic from "next/dynamic";
import type { Product } from "@/types";

const SimmilerProducts2 = dynamic(
  () => import("@/components/product-details/others/SimmilerProducts2"),
  { ssr: false },
);
const BoughtTogether2 = dynamic(
  () => import("@/components/product-details/others/BoughtTogether2"),
  { ssr: false },
);

export default function FashionProductDeferredSections({
  product,
}: {
  product: Product;
}) {
  return (
    <>
      <SimmilerProducts2 product={product} />
      <BoughtTogether2 product={product} />
    </>
  );
}
