"use client";
import { useState } from "react";

import ProductCard1 from "@/components/product-cards/ProductCard1";
import NavEffectTabs from "@/components/common/ui/NavEffectTabs";
import { useTopSellingProducts } from "@/hooks/use-top-selling-products";
import DataBoundary from "@/components/common/loading/DataBoundary";
import type { TopSellingPeriod } from "@/lib/backend/storefront-data";

const TABS = [
  { id: "this-week", label: "This Week" },
  { id: "this-month", label: "This Month" },
  { id: "this-year", label: "This Year" },
  { id: "view-all", label: "All Time" },
];

// The "view-all" tab id predates this component - NavEffectTabs treats it
// specially (renders in its own trailing group), so the id stays as-is and
// only gets translated to the API's "all-time" period here.
function toPeriod(tabId: string): TopSellingPeriod {
  return tabId === "view-all" ? "all-time" : (tabId as TopSellingPeriod);
}

export default function Products3() {
  const [activeTab, setActiveTab] = useState<string>("this-week");
  const { products, basis, loading, error, hasData, refresh } =
    useTopSellingProducts({ period: toPeriod(activeTab), limit: 8 });

  return (
    <div
      id="best-sellers"
      className="rbt-component-area rbt-products-area rbt-section-gap rbt-bg-color-white"
    >
      <div className="container">
        <div className="row">
          <div className="col-lg-12">
            <div className="rbt-component-section-title text-center border-0 p-0 align-items-center">
              <h2 className="rbt-title rbt-scroll-trigger fade_in animation-order-1">
                <span className="rbt-bold--text">Top Selling </span>Items
              </h2>
              <p className="description rbt-scroll-trigger fade_in animation-order-2">
                The pet costumes, carriers, and care essentials shoppers love
                most - pick a time period to see what&apos;s trending.
              </p>
              <div className="d-flex align-items-center justify-content-center rbt-gap--8 mb--16">
                <span className="rbt-flash-animation d-inline-flex" aria-hidden="true">
                  <svg width="8" height="8" viewBox="0 0 8 8">
                    <circle cx="4" cy="4" r="4" fill="#22c55e" />
                  </svg>
                </span>
                <span className="b4" style={{ color: "#22c55e", fontWeight: 600 }}>
                  {basis === "sales"
                    ? "Live · ranked from real orders"
                    : "Live · highly rated (no sales yet this period)"}
                </span>
              </div>
              <div className="mobile-horizontal-scroll-section">
                <NavEffectTabs
                  parentClassName="rbt-product-nav-section rbt-scroll-trigger fade_in animation-order-3 justify-content-center"
                  options={TABS}
                  active={activeTab}
                  setActive={setActiveTab}
                />
              </div>
            </div>
          </div>
        </div>
        {/* Start Card Area */}
        <DataBoundary loading={loading} error={error} ready={hasData} onRetry={refresh}
          label="Loading top selling items" empty={!products.length} emptyMessage="No products are available yet.">
        <div className="row row--12 mt_dec--24 rbt-mobile-row">
          {/* Start Single Card  */}
          {products.map((product, i) => (
            <div
              key={i}
              className="col-lg-3 col-xl-3 col-xxl-3 col-md-6 col-sm-12 col-12 mt--24"
            >
              <ProductCard1
                detailsPageUrl="/product"
                product={product}
                key={i}
                animationOrder={i + 1}
              />
            </div>
          ))}

          {/* End Single Card  */}
        </div>
        {/* End Card Area */}
        </DataBoundary>
      </div>
    </div>
  );
}
