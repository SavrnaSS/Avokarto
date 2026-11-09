"use client";
import { WaveFatIcon } from "../svg-icons";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import DataBoundary from "@/components/common/loading/DataBoundary";

import {
  clearAllFilters,
  setCurrentPage,
  setItemPerPage,
  setSorting,
  toggleTag,
} from "../reducer/filterActions";
import ProductCard9 from "../product-cards/ProductCard9";
import ProductCard8 from "../product-cards/ProductCard8";
import FilterByTag from "./filterComponents/FilterByTag";
import DropdownSelect from "../common/select/DropdownSelect";
import ShopPagination from "./ShopPagination";
import InfiniteScrollTrigger from "./InfiniteScrollTrigger";
import FilterMeta from "./FilterMeta";
import Sidebar from "./Sidebar";
import LayoutHandler from "./LayoutHandler";
import SidebarScrollable from "./SidebarScrollable";
import { Product } from "@/types/product";

import { useShopState } from "./useShopState";
import ProductCard16 from "../product-cards/ProductCard16";
import ProductCard1 from "../product-cards/ProductCard1";
import ProductCard10 from "../product-cards/ProductCard10";
import ProductCard5 from "../product-cards/ProductCard5";
import ProductCard4 from "../product-cards/ProductCard4";
import ProductSmallCard from "../product-cards/ProductCardElectronicsList";
import ProductCard22 from "../product-cards/ProductCard22";
import { useAdvertisement } from "@/hooks/use-advertisement";

type CardVariant =
  | "default"
  | "scale-hover"
  | "hover-add-to-cart"
  | "standard"
  | "icons-hover"
  | "button-on-image"
  | "button-on-image-signin"
  | "additional-info"
  | "button-visible-hover"
  | "shadow-hover"
  | "small-variation";

export default function ShopDefault({
  rightSidebar = false,
  stickyTop = false,
  sidebarScrollAble = false,
  loaderType = "pagination",
  column: initialColumn = 3,
  containerFull = false,
  wider = false,
  defaultFilterTag = [] as string[],
  defaultFilterCategory = [] as string[],
  itemPerPage = 0,
  showBestSellerBadge = false,
  countdownStyle = "default",
  showQuantityBadge = false,
  cardVariant = "default",
  products,
  hasCardBorder = false,
  detailsPageUrl = "/product",
  hasMoreRemote = false,
  remoteLoading = false,
  onLoadMore,
  searchQuery: controlledSearchQuery,
  onSearchQueryChange,
  onCategoriesChange,
  productsLoading = false,
  productsError = null,
  productsReady = true,
  onRetryProducts,
}: {
  rightSidebar?: boolean;
  stickyTop?: boolean;
  sidebarScrollAble?: boolean;
  loaderType?: "pagination" | "button" | "infinite";
  column?: number;
  containerFull?: boolean;
  wider?: boolean;
  defaultFilterTag?: string[];
  defaultFilterCategory?: string[];
  itemPerPage?: number;
  showBestSellerBadge?: boolean;
  countdownStyle?: "default" | "compact";
  showQuantityBadge?: boolean;
  cardVariant?: CardVariant;
  products?: Product[];
  hasCardBorder?: boolean;
  detailsPageUrl?: string;
  // "infinite" mode only: whether the backend has more products beyond
  // what's already been fetched, whether a fetch for the next batch is in
  // flight, and the callback to request that next batch.
  hasMoreRemote?: boolean;
  remoteLoading?: boolean;
  onLoadMore?: () => void;
  // Controlled search box, used by LiveShopDefault to drive a real backend
  // search (see useLiveProducts({ search })) instead of the client-side
  // filter below. Omitted by the many static-data demo pages, which fall
  // back to filtering whatever `products` they were given locally.
  searchQuery?: string;
  onSearchQueryChange?: (value: string) => void;
  onCategoriesChange?: (value: string[]) => void;
  productsLoading?: boolean;
  productsError?: string | null;
  productsReady?: boolean;
  onRetryProducts?: () => void;
}) {
  const [localSearchQuery, setLocalSearchQuery] = useState("");
  const isSearchControlled =
    controlledSearchQuery !== undefined && onSearchQueryChange !== undefined;
  const searchQuery = isSearchControlled ? controlledSearchQuery : localSearchQuery;
  const setSearchQuery = isSearchControlled ? onSearchQueryChange : setLocalSearchQuery;
  const normalizedSearchQuery = searchQuery.trim().toLowerCase();
  const searchedProducts = useMemo(() => {
    // When controlled, the parent already ran a real backend search
    // (products here are already the matched set) - filtering again here
    // would double-apply stale local text against an already-narrowed list.
    if (isSearchControlled) return products;
    if (!products || !normalizedSearchQuery) return products;

    return products.filter((product) => {
      const searchableText = [
        product.title,
        ...(product.category ?? []),
        ...(product.filterCategory ?? []),
        ...(product.tags ?? []),
      ]
        .join(" ")
        .toLowerCase();

      return searchableText.includes(normalizedSearchQuery);
    });
  }, [isSearchControlled, normalizedSearchQuery, products]);

  // The grid buttons switch columns in place (2 / 3 / 4 across).
  const [pickedColumn, setPickedColumn] = useState<number | null>(null);
  const column = pickedColumn ?? initialColumn;
  const { advertisement } = useAdvertisement();
  const { state, dispatch, visibleProducts, getFilterCount, isLoadMore, sourceProducts } =
    useShopState({
      column,
      loaderType,
      defaultTags: defaultFilterTag,
      defaultCategories: defaultFilterCategory,
      itemPerPage,
      products: searchedProducts,
    });
  useEffect(() => {
    onCategoriesChange?.(state.categories);
  }, [onCategoriesChange, state.categories]);
  const columnClass = useMemo(() => {
    if (column <= 4) {
      return `col-xxl-${12 / column} col-xl-6 col-lg-6 col-md-6 col-sm-6 col-6 product-col mt--24 ${containerFull ? "" : "product-four-col"}`;
    } else if (column == 5) {
      return `col-xl-1-5 col-lg-6 col-md-6 col-6 mt--24 product-five-col`;
    } else if (column == 6) {
      return `col-xxl-2 col-xl-2 col-lg-3 col-md-4 col-sm-6 col-6 mt--24`;
    }
    return "col-lg-4 col-md-6 col-sm-6 col-6 product-col";
  }, [column, containerFull]);

  const shouldShowPricingBadge = useMemo(() => column <= 4, [column]);
  const shouldShowTimer = useMemo(() => column <= 4, [column]);
  const sidebarColClass = useMemo(() => {
    if (wider) {
      return "col-xxl-2 col-xl-3 col-lg-4 col-md-12 col-sm-12 col-12 mt--24";
    }
    return "col-lg-3 col-md-12 col-sm-12 col-12 mt--24";
  }, [wider]);

  const contentColClass = useMemo(() => {
    if (wider) {
      return "col-xxl-10 col-xl-9 col-lg-8 col-md-12 col-sm-12 col-12 mt--24";
    }
    return "col-lg-9 col-md-12 col-sm-12 col-12 mt--24";
  }, [wider]);

  const hasNoFilteredItems = state.sorted.length === 0;
  const hasMultiplePages = state.sorted.length > state.itemPerPage;
  const fromResult = hasNoFilteredItems
    ? 0
    : (state.currentPage - 1) * state.itemPerPage + 1;
  const toResult = hasNoFilteredItems
    ? 0
    : Math.min(state.currentPage * state.itemPerPage, state.sorted.length);

  const ProductCardComponent = useMemo(() => {
    switch (cardVariant) {
      case "scale-hover":
        return ProductCard16;
      case "hover-add-to-cart":
        return ProductCard1;
      case "button-on-image":
        return ProductCard5;
      case "button-on-image-signin":
        return ProductCard22;
      case "standard":
        return ProductCard10;
      case "icons-hover":
        return ProductCard8;
      case "button-visible-hover":
        return ProductCard4;
      case "additional-info":
      case "shadow-hover":
        return ProductCard16;
      case "small-variation":
        return ProductSmallCard;
      case "default":
      default:
        return ProductCard9;
    }
  }, [cardVariant]);

  return (
    <div className="rbt-component-area rbt-shop-filter-area rbt-bg-color-white rbt-section-gapBottom">
      <div
        className={`${containerFull ? "rbt-full-width-wrapper" : "container"}`}
      >
        <div
          className={`row row--16 mt_dec--24  ${
            rightSidebar ? "flex-row-reverse" : ""
          } `}
        >
          <div className={sidebarColClass}>
            <aside
              className={`rbt-sidebar has-rbt-fshape ${
                stickyTop ? "sticky-top" : ""
              }`}
            >
              <div className="rbt-sidebar-widget-wrapper rbt-sidebar-bg-one position-relative">
                <div className="rbt-sidebar-top">
                  <h6 className="rbt-sidebar-title">
                    <i className="fa-sharp fa-regular fa-filter-list mr--4" />
                    Filter &amp; Refine
                    <span className="rbt-fshape-right-portion">
                      <WaveFatIcon />
                    </span>
                  </h6>
                </div>
                {sidebarScrollAble ? (
                  <SidebarScrollable
                    getFilterCount={getFilterCount}
                    state={state}
                    dispatch={dispatch}
                    sourceProducts={sourceProducts}
                  />
                ) : (
                  <Sidebar
                    getFilterCount={getFilterCount}
                    state={state}
                    dispatch={dispatch}
                    sourceProducts={sourceProducts}
                  />
                )}
              </div>
              {advertisement && (
                <div className="rbt-sidebar-widget-wrapper">
                  <div className="rbt-sidebar-widget-img">
                    <Link href={advertisement.linkUrl || "/shop"}>
                      <Image
                        alt={advertisement.title}
                        src={advertisement.imageUrl}
                        width={628}
                        height={840}
                      />
                    </Link>
                  </div>
                </div>
              )}
            </aside>
          </div>
          <div className={contentColClass}>
            <div className="row row--12">
              <div className="col-md-12">
                <div className="rbt-shop-tools-wrapper">
                  <div className="rbt-shop-tool-content rbt-shop-filter-tag-wrapper w-100">
                    <h6 className="rbt-shop-tools-title">Quick Filters :</h6>
                    <div className="rbt-shop-filter-tag-list rbt-tag-list rbt-tag-list-rounded rbt-tag-list-var-one">
                      <FilterByTag
                        selectedItems={state.tags}
                        onChange={(value) =>
                          toggleTag(value, dispatch, state.tags)
                        }
                        sourceProducts={sourceProducts}
                      />
                    </div>
                  </div>
                </div>
                <div className="rbt-shop-tools-wrapper rbt-shop-tools-wrapper-var-one mt--20">
                  <div className="rbt-shop-tool-content rbt-shop-view-var-wrapper">
                    <h6 className="rbt-shop-tools-title">
                      Showing {fromResult}-{toResult} of{" "}
                      {state.sorted.length ?? 0} results
                    </h6>
                    <div className="rbt-shop-view-btn-list rbt-tag-list-rounded rbt-shop-view-menu">
                      <LayoutHandler column={column} onChange={setPickedColumn} />
                    </div>
                  </div>
                  <div className="rbt-shop-tool-content rbt-shop-view-sort-wrapper">
                    <div className="rbt-tools-select-single">
                      <h6 className="rbt-shop-tools-title">Sort :</h6>
                      <div className="rbt-modern-select rbt-shop-view-sort-select-one">
                        <DropdownSelect
                          selected={state.sortingOption}
                          onChange={(value) => setSorting(value, dispatch)}
                        />
                      </div>
                    </div>
                    <div className="rbt-tools-select-single">
                      <h6 className="rbt-shop-tools-title">Show :</h6>
                      <div className="rbt-modern-select rbt-shop-view-sort-select-two">
                        <DropdownSelect
                          selected={`${state.itemPerPage} Items`}
                          options={[
                            "15 Items",
                            "12 Items",
                            "9 Items",
                            "6 Items",
                            "3 Items",
                          ]}
                          onChange={(value) =>
                            setItemPerPage(
                              Number(value.split(" ")[0]),
                              dispatch,
                            )
                          }
                        />
                      </div>
                    </div>
                  </div>
                  <div className="rbt-shop-tool-content rbt-shop-view-var-wrapper">
                    <div className="rbt-inner-search-field style-one rbt-search-field-rounded">
                      <input
                        type="text"
                        placeholder="Search pet costumes, gear, and more"
                        value={searchQuery}
                        onChange={(event) => setSearchQuery(event.target.value)}
                      />
                      <button
                        className="rbt-round-btn search-btn"
                        type="button"
                        aria-label="Search products"
                      >
                        <i className="fa-solid fa-magnifying-glass" />
                      </button>
                    </div>
                  </div>
                </div>
                <div className="rbt-shop-tools-wrapper">
                  <div className="rbt-shop-tool-content rbt-shop-filter-tag-wrapper">
                    <FilterMeta state={state} dispatch={dispatch} />
                  </div>
                </div>
              </div>
            </div>
            {/* Start Card Area */}
            {productsError && productsReady && (
              <p role="status" className="mt--24">
                Products could not be updated. {" "}
                <button type="button" className="rbt-btn-link" onClick={onRetryProducts}>Try again</button>
              </p>
            )}
            <DataBoundary
              loading={productsLoading}
              error={productsError}
              ready={productsReady}
              onRetry={() => onRetryProducts?.()}
              count={8}
              label="Loading shop products"
            >
              <div className={`row row--12 ${hasCardBorder ? "mt--24" : ""}`}>
                {hasNoFilteredItems && hasMoreRemote ? (
                  <div className="col-12 mt--24" role="status">
                    {productsError ? "Unable to load more matching products." : "Loading matching products…"}
                  </div>
                ) : hasNoFilteredItems ? (
                  <div className="col-12 mt--24">
                    <div className="text-center rbt-radius p--24">
                      <h6 className="mb--8">No items found</h6>
                      <p className="rbt-text-color-body mb--16">
                        No products match your selected filters.
                      </p>
                      <button
                        type="button"
                        className="rbt-btn rbt-btn-sm"
                        onClick={() => {
                          setSearchQuery("");
                          clearAllFilters(dispatch);
                        }}
                      >
                        Clear Filters
                      </button>
                    </div>
                  </div>
                ) : (
                  visibleProducts.map((product) => (
                    <div
                      key={product.catalogId ?? product.id}
                      className={
                        columnClass +
                        (hasCardBorder ? " rbt-border mt--0" : " mt--24")
                      }
                      style={
                        hasCardBorder
                          ? { marginTop: "-1px", marginLeft: "-1px" }
                          : undefined
                      }
                    >
                      <ProductCardComponent
                        detailsPageUrl={detailsPageUrl}
                        showBestSellerBadge={showBestSellerBadge}
                        showPricingBadge={shouldShowPricingBadge}
                        shouldShowTimer={shouldShowTimer}
                        showQuantityBadge={showQuantityBadge}
                        product={product}
                        countdownStyle={countdownStyle as "default" | "compact"}
                      />
                    </div>
                  ))
                )}
              </div>
              {/* End Card Area */}
              <div className="row mt--40 mt_sm--16">
                <div className="col-12">
                  {loaderType === "infinite" ? (
                    (hasMoreRemote || (!hasNoFilteredItems && hasMultiplePages)) && (
                      <InfiniteScrollTrigger
                        itemCount={visibleProducts.length}
                        loading={remoteLoading}
                        done={
                          !hasMoreRemote &&
                          state.currentPage * state.itemPerPage >=
                            state.sorted.length
                        }
                        skeletonCount={column}
                        onIntersect={() => {
                          if (
                            state.currentPage * state.itemPerPage <
                            state.sorted.length
                          ) {
                            setCurrentPage(state.currentPage + 1, dispatch);
                          } else if (hasMoreRemote) {
                            onLoadMore?.();
                          }
                        }}
                      />
                    )
                  ) : hasNoFilteredItems || !hasMultiplePages ? null : !isLoadMore ? (
                    <ShopPagination
                      key={state.itemPerPage}
                      state={state}
                      dispatch={dispatch}
                    />
                  ) : (
                    <>
                      {state.currentPage * state.itemPerPage <
                        state.sorted.length && (
                        <div className="rbt-load-more-btn-area text-center">
                          <button
                            type="button"
                            onClick={() => {
                              setCurrentPage(state.currentPage + 1, dispatch);
                            }}
                            className="rbt-btn"
                          >
                            Load More <i className="fa-solid fa-spinner ml--4" />
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </DataBoundary>
          </div>
        </div>
      </div>
    </div>
  );
}
