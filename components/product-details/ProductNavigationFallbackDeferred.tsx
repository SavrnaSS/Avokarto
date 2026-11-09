"use client";

import Footer10 from "@/components/footers/Footer10";
import Description2 from "@/components/product-details/descriptions/Description2";
import FashionProductDeferredSections from "@/components/product-details/FashionProductDeferredSections";
import BottomStickyProduct from "@/components/product-details/others/BottomStickyProduct";
import type { Product } from "@/types";

export default function ProductNavigationFallbackDeferred({
  product,
}: {
  product: Product;
}) {
  return (
    <>
      <Description2 product={product} />
      <FashionProductDeferredSections product={product} />
      <BottomStickyProduct product={product} detailsPageUrl="/product" />
      <Footer10 />
    </>
  );
}
