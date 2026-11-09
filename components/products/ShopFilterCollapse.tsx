"use client";

import { useEffect, useMemo, useReducer, useState } from "react";
import { initialState, reducer } from "../reducer/filterReducer";
import { electronicsCardData } from "@/data/products/electronics";
import type { Product } from "@/types";
import {
  setItemPerPage,
  setSorting,
  toggleTag,
} from "../reducer/filterActions";
import ProductCard9 from "../product-cards/ProductCard9";
import DropdownSelect from "../common/select/DropdownSelect";
import ShopPagination from "./ShopPagination";
import FilterMeta from "./FilterMeta";
import LayoutHandler from "./LayoutHandler";
import ProductViewTabs from "./ProductViewTabs";
import CollapseFilterPanel from "./CollapseFilterPanel";
import FilterByTagTwo from "./filterComponents/FilterByTagTwo";

const COLUMN = 4;
const columnClass =
  "col-xxl-3 col-lg-4 col-md-6 col-sm-6 col-6 mt--24 product-col";

export default function ShopFilterCollapse({
  products = electronicsCardData,
  detailsPageUrl,
}: { products?: Product[]; detailsPageUrl?: string }) {
  const [state, dispatch] = useReducer(reducer, {
    ...initialState,
    filtered: products,
    sorted: products,
    itemPerPage: COLUMN * 4,
  });

  const [filterCollapseOpen, setFilterCollapseOpen] = useState(false);

  useEffect(() => {
    dispatch({ type: "FILTER_PRODUCTS", payload: products });
  }, [
    products,
    state.brands,
    state.categories,
    state.colors,
    state.size,
    state.activeFilterOnSale,
    state.activeFilterInStock,
    state.services,
    state.ratings,
    state.price,
    state.tags,
  ]);

  useEffect(() => {
    dispatch({ type: "SORT_PRODUCTS" });
  }, [state.sortingOption, state.filtered]);

  const visibleProducts = useMemo(
    () =>
      state.sorted.slice(
        (state.currentPage - 1) * state.itemPerPage,
        state.currentPage * state.itemPerPage,
      ),
    [state.sorted, state.currentPage, state.itemPerPage],
  );

  function getFilterCount(
    filterFunction: (product: Product) => boolean,
  ) {
    return products.filter((product) => filterFunction(product))
      .length;
  }

  return (
    <div className="rbt-component-area rbt-shop-filter-area rbt-bg-color-white rbt-section-gapBottom">
      <div className="container">
        <div className="row row--12 mt_dec--12">
          <div className="col-lg-12 col-md-12 col-sm-12 col-12 mt--12">
            <div className="row row--12">
              <div className="col-md-12">
                <div className="rbt-shop-tools-wrapper">
                  <div className="rbt-shop-tool-content rbt-shop-filter-tag-wrapper justify-content-start">
                    <h6 className="rbt-shop-tools-title">Product View :</h6>
                    <ProductViewTabs state={state} dispatch={dispatch} />
                  </div>
                  <div className="rbt-shop-tool-content rbt-shop-filter-tag-wrapper">
                    <h6 className="rbt-shop-tools-title">Fast FIlter :</h6>
                    <div className="rbt-shop-filter-tag-list rbt-tag-list rbt-tag-list-rounded rbt-tag-list-var-one">
                      <FilterByTagTwo
                        selectedItems={state.tags}
                        onChange={(value) =>
                          toggleTag(value, dispatch, state.tags)
                        }
                      />
                    </div>
                  </div>
                  <div className="rbt-shop-tool-content rbt-shop-filter-tag-wrapper justify-content-end">
                    <ShopPagination
                      parentClass="rbt-nav-effect-activation text-center d-flex align-items-center rbt-gap--8"
                      listClass="rbt-pagination rbt-pagination-sm d-inline-flex"
                      state={state}
                      dispatch={dispatch}
                    />
                  </div>
                </div>
                <div className="rbt-shop-tools-wrapper rbt-shop-tools-wrapper-var-one mt--20">
                  <div className="rbt-shop-tool-content rbt-shop-view-var-wrapper">
                    <h6 className="rbt-shop-tools-title">
                      Showing {(state.currentPage - 1) * state.itemPerPage + 1}–
                      {Math.min(
                        state.currentPage * state.itemPerPage,
                        state.sorted.length,
                      )}{" "}
                      of {state.sorted.length} results
                    </h6>
                    <div className="rbt-shop-view-btn-list rbt-tag-list-rounded rbt-shop-view-menu">
                      <LayoutHandler />
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
                            "16 Items",
                            "12 Items",
                            "8 Items",
                            "4 Items",
                            "2 Items",
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
                        placeholder="Search for products"
                        aria-label="Search for products"
                      />
                      <button
                        className="rbt-round-btn search-btn"
                        type="submit"
                        aria-label="Search"
                      >
                        <i className="fa-solid fa-magnifying-glass" />
                      </button>
                    </div>
                  </div>
                  <div className="rbt-shop-tool-content rbt-shop-view-var-wrapper">
                    <h6 className="rbt-shop-tools-title">
                      <button
                        type="button"
                        className="rbt-filter-button"
                        onClick={() => setFilterCollapseOpen((open) => !open)}
                        aria-expanded={filterCollapseOpen}
                        aria-controls="rbt-collapse-area"
                      >
                        <i className="fa-sharp fa-regular fa-filter mr--4" />
                        <span className="filter-text">
                          {filterCollapseOpen ? "Hide Filter" : "Show Filter"}
                        </span>
                      </button>
                    </h6>
                  </div>
                </div>
                <div className="rbt-shop-tools-wrapper">
                  <div className="rbt-shop-tool-content rbt-shop-filter-tag-wrapper">
                    <FilterMeta state={state} dispatch={dispatch} />
                  </div>
                </div>
              </div>
              <div className="col-12">
                <div
                  className={`rbt-filter-content collapse ${filterCollapseOpen ? "show" : ""}`}
                  id="rbt-collapse-area"
                >
                  <div className="rbt-component-area ptb--24">
                    <div className="rbt-separator rbt-separator-gray200" />
                  </div>
                  <CollapseFilterPanel
                    state={state}
                    dispatch={dispatch}
                    getFilterCount={getFilterCount}
                  />
                </div>
                {/* Start Card Area */}
                <div className="row row--12">
                  {visibleProducts.length === 0 ? (
                    <div className="col-12 mt--24">
                      <p className="rbt-text-color-body">
                        No products match your filters. Try adjusting or
                        clearing filters.
                      </p>
                    </div>
                  ) : (
                    visibleProducts.map((product, i) => (
                      <div key={i} className={columnClass}>
                        <ProductCard9
                          detailsPageUrl={detailsPageUrl}
                          showPricingBadge
                          shouldShowTimer
                          product={product}
                          animationOrder={i + 1}
                        />
                      </div>
                    ))
                  )}
                </div>
                {/* End Card Area */}
                <div className="row mt--40 mt_sm--12">
                  <div className="col-12">
                    <ShopPagination
                      prevNextClass="nothing"
                      state={state}
                      dispatch={dispatch}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
