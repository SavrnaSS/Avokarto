"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ProductCard1 from "@/components/product-cards/ProductCard1";
import { useLiveProducts } from "@/hooks/use-live-products";
import { useLiveCategories } from "@/hooks/use-live-categories";
import { useUiStore } from "@/context/uiStore";
import DataBoundary from "@/components/common/loading/DataBoundary";

export default function SearchPanelContent() {
  const router = useRouter();
  const closeCommonSearch = useUiStore((state) => state.closeCommonSearch);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => clearTimeout(timeout);
  }, [query]);

  const { products: liveProducts, loading, error, hasData, refresh } = useLiveProducts({
    limit: 8,
    search: debouncedQuery || undefined,
  });
  const { categories } = useLiveCategories();
  // Published categories with products only - an empty category is a dead
  // end, not a suggestion.
  const liveCategories = categories
    .filter((category) => category.status === "published" && category.count > 0)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));

  const results = liveProducts.slice(0, 4);

  const goToResults = (params: URLSearchParams) => {
    closeCommonSearch();
    const queryString = params.toString();
    router.push(queryString ? `/shop?${queryString}` : "/shop");
  };

  return (
    <div className="wrapper">
      <div className="row">
        <div className="col-lg-12">
          <div className="rbt-component-section-title border-0 p-0 text-center">
            <h4 className="rbt-title text-start text-md-center">
              <span className="rbt-bold--text">What are you looking for?</span>
            </h4>
          </div>
        </div>
      </div>
      <div className="row">
        <div className="col-lg-12">
          <form
            className="rbt-search-form"
            onSubmit={(event) => {
              event.preventDefault();
              const params = new URLSearchParams();
              if (query.trim()) params.set("q", query.trim());
              goToResults(params);
            }}
          >
            <div className="input-section position-relative w-100 mr--12 mr_sm--4">
              <input
                className="search-input"
                type="text"
                placeholder="Search pet costumes, carriers, lights…"
                aria-label="Search products"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
              <i
                className="fa-sharp fa-regular inner-search-icon fa-magnifying-glass"
                aria-hidden="true"
              />
            </div>
            <div className="submit-btn">
              <button type="submit" className="rbt-btn btn-md">
                Search
              </button>
            </div>
          </form>
        </div>
      </div>
      {liveCategories.length ? (
        <div className="row">
          <div className="col-lg-12">
            <div className="border-0 p-0 text-left title-sm-fsize">
              <h6 className="title">
                <span className="rbt-bold--text">Shop by category</span>
              </h6>
            </div>
          </div>
          <div className="rbt-search-list-wrapper rbt-tag-list rbt-tag-list-rounded-lg">
            {liveCategories.map((category) => (
              <Link
                key={category.slug}
                href={`/shop?category=${encodeURIComponent(category.name)}`}
                onClick={closeCommonSearch}
              >
                {category.name}
              </Link>
            ))}
          </div>
        </div>
      ) : null}
      <div className="rbt-separator-mid ptb--24 ptb_sm--12">
        <hr className="rbt-separator m-0" />
      </div>
      <div className="row">
        <div className="col-lg-12">
          <div className="border-0 p-0 text-left title-sm-fsize">
            <h6 className="title">
              <span className="rbt-bold--text">
                {debouncedQuery ? `Results for "${debouncedQuery}"` : "New Arrivals"}
              </span>
            </h6>
          </div>
        </div>
      </div>
      <DataBoundary loading={loading || query.trim() !== debouncedQuery} error={error} ready={hasData}
        onRetry={refresh} label="Loading search results" count={4}>
      <div className="row row--12 mt_dec--24">
        {results.length ? (
          results.map((product) => (
            <div
              key={product.id}
              className="col-xl-3 col-lg-6 col-md-6 col-sm-6 col-6 mt--24 mt_sm--16"
            >
              <ProductCard1
                detailsPageUrl="/product"
                product={product}
              />
            </div>
          ))
        ) : (
          <div className="col-lg-12 mt--24">
            <p className="mb-0">No products matched your search.</p>
          </div>
        )}
      </div>
      </DataBoundary>
    </div>
  );
}
