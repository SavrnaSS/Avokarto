"use client";

import { GridMatrixIcon, WaveSquareIcon } from "../../svg-icons";
import Image from "next/image";
import {
  recentlyViewed as defaultRecentlyViewed,
  recommendedProducts as defaultrecommendedProducts,
} from "@/data/products/others";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Product } from "@/types/product";
import ProductRating from "@/components/common/ui/ProductRating";
import { hasStoredView, useRecentlyViewedProducts } from "@/hooks/use-recently-viewed";
import { useRecommendedProducts } from "@/hooks/use-recommended-products";
import styles from "./RecomendedProducts.module.css";
import DataBoundary from "@/components/common/loading/DataBoundary";
import LoadingSkeleton from "@/components/common/loading/LoadingSkeleton";
import { useCurrency } from "@/lib/currency";

function ProductRow({
  product,
  detailsPageUrl,
}: {
  product: Product;
  detailsPageUrl: string;
}) {
  const href = `${detailsPageUrl}/${product.slug ?? product.id}`;
  const { formatPrice } = useCurrency();

  return (
    <div
      className={`rbt-card rbt-product-card rbt-list-view-variation list-view-md ${styles.row}`}
    >
      <div className="inner">
        <div className="rbt-card-body">
          <ProductRating product={product} />
          <h6 className="rbt-card-title">
            <Link href={href}>{product.title}</Link>
          </h6>
          <div className="pricing-part">
            {product.oldPrice ? (
              <del className="price-text">{formatPrice(product.oldPrice)}</del>
            ) : null}
            <span className="price-text">{formatPrice(product.price)}</span>
          </div>
        </div>
        <div className="rbt-card-img rbt-bg-color-default rbt-curved-style-box">
          <Link href={href}>
            <Image alt={product.title} src={product.imgSrc} width={1184} height={928} />
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function RecomendedProducts({
  currentProduct,
  recentlyViewedProducts = defaultRecentlyViewed,
  recommendedProducts = defaultrecommendedProducts,
  parentClass = "rbt-tab rbt-product-single-details-tab rbt-fshape-tab",
  detailsPageUrl = "/product",
}: {
  currentProduct?: Product | null;
  recentlyViewedProducts?: Product[];
  recommendedProducts?: Product[];
  parentClass?: string;
  detailsPageUrl?: string;
}) {
  // "viewed" on first render, always - both the server and the client's
  // first paint have to agree (no access to localStorage during SSR) or
  // React flags a hydration mismatch. The smart default below only kicks
  // in from a useEffect, which never runs during SSR.
  const [activeTab, setActiveTab] = useState<"viewed" | "recommended">(
    "viewed",
  );
  const [userPickedTab, setUserPickedTab] = useState(false);

  // Real products (Fashion's live product page passes currentProduct) use
  // actual browsing history + real catalog data instead of the fixed demo
  // lists below, and stay live via the "products" realtime topic - an admin
  // price/stock edit shows up here without a refresh. Every other caller
  // (the ~10 unreachable demo product templates) doesn't pass
  // currentProduct, so it keeps the original static behavior unchanged.
  const isLive = Boolean(currentProduct);
  const excludeId = currentProduct
    ? (currentProduct.catalogId ?? String(currentProduct.id))
    : undefined;

  const liveViewed = useRecentlyViewedProducts({
    enabled: isLive,
    excludeId,
  });
  const liveRecommended = useRecommendedProducts({
    currentProduct: isLive ? currentProduct : undefined,
  });

  const viewedList = isLive ? liveViewed.products : recentlyViewedProducts;
  const recommendedList = isLive ? liveRecommended.products : recommendedProducts;

  // A first-time visitor has nothing to show under "Recently Viewed" - land
  // them on "Recommended" instead of an empty tab. hasStoredView() is a
  // synchronous localStorage read, so this resolves before the (async)
  // product fetches even finish; it also re-checks once those fetches
  // settle, in case every stored id turned out to point at since-removed
  // products. Never overrides a tab the visitor already clicked themselves.
  useEffect(() => {
    if (!isLive || userPickedTab) return;

    if (viewedList.length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveTab("viewed");
    } else if (!hasStoredView(excludeId)) {
      setActiveTab("recommended");
    }
  }, [excludeId, isLive, userPickedTab, viewedList]);

  return (
    <div className={`${parentClass} ${styles.wrapper}`}>
      <div className="rbt-tab-nav-wrapper">
        <ul className="nav nav-tabs" id="rbt-product-recomTab" role="tablist">
          <li className="nav-item" role="presentation">
            <button
              type="button"
              className={`nav-link${activeTab === "viewed" ? " active" : ""}`}
              onClick={() => {
                setUserPickedTab(true);
                setActiveTab("viewed");
              }}
            >
              Recently Viewed
              <span className="rbt-fshape-portion rbt-fshape-left-portion">
                <GridMatrixIcon />
              </span>
              <span className="rbt-fshape-portion rbt-fshape-right-portion">
                <WaveSquareIcon />
              </span>
            </button>
          </li>
          <li className="nav-item" role="presentation">
            <button
              type="button"
              className={`nav-link${activeTab === "recommended" ? " active" : ""}`}
              onClick={() => {
                setUserPickedTab(true);
                setActiveTab("recommended");
              }}
            >
              Recommended
              <span className="rbt-fshape-portion rbt-fshape-left-portion">
                <GridMatrixIcon />
              </span>
              <span className="rbt-fshape-portion rbt-fshape-right-portion">
                <WaveSquareIcon />
              </span>
            </button>
          </li>
        </ul>
      </div>
      <div className="tab-content">
        <div
          className={`tab-pane fade${activeTab === "viewed" ? " active show" : ""}`}
        >
          <div className="rbt-single-prd-viewed-prd-area">
            <div className="rbt-list-card-box rbt-list-card-box border-0 p-0">
              {isLive && liveViewed.loading ? <LoadingSkeleton layout="table" count={3} label="Loading recently viewed products" /> : viewedList.length ? (
                viewedList.map((product) => (
                  <ProductRow
                    key={product.catalogId ?? product.id}
                    product={product}
                    detailsPageUrl={detailsPageUrl}
                  />
                ))
              ) : isLive ? (
                <p className="b3 rbt-text-color-gray-400 mb-0">
                  Products you view will show up here.
                </p>
              ) : null}
            </div>
          </div>
        </div>
        <div
          className={`tab-pane fade${activeTab === "recommended" ? " active show" : ""}`}
        >
          <div className="rbt-single-prd-recom-prd-area">
            <DataBoundary loading={isLive && liveRecommended.loading} error={liveRecommended.error}
              ready={!isLive || liveRecommended.hasData} onRetry={liveRecommended.refresh}
              layout="table" count={3} label="Loading recommendations">
            <div className="rbt-list-card-box rbt-list-card-box border-0 p-0">
              {recommendedList.length ? (
                recommendedList.map((product) => (
                  <ProductRow
                    key={product.catalogId ?? product.id}
                    product={product}
                    detailsPageUrl={detailsPageUrl}
                  />
                ))
              ) : isLive ? (
                <p className="b3 rbt-text-color-gray-400 mb-0">
                  No recommendations available right now.
                </p>
              ) : null}
            </div>
            </DataBoundary>
          </div>
        </div>
      </div>
    </div>
  );
}
