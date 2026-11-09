"use client";

import DataBoundary from "@/components/common/loading/DataBoundary";
import { useLiveProducts } from "@/hooks/use-live-products";
import ShopFilterCollapse from "./ShopFilterCollapse";

export default function LiveShopFilterCollapse() {
  const { products, loading, error, hasData, refresh } = useLiveProducts({ limit: 48 });
  return (
    <div className={!hasData || !products.length ? "container rbt-section-gapBottom" : undefined}>
    <DataBoundary loading={loading} error={error} ready={hasData} onRetry={refresh}
      count={8} label="Loading shop products" empty={!products.length}
      emptyMessage="No products are available yet.">
      <ShopFilterCollapse products={products} detailsPageUrl="/product" />
    </DataBoundary>
    </div>
  );
}
