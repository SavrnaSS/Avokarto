"use client";

import type { Dispatch } from "react";
import type { FilterAction, FilterState, Product } from "@/types";
import {
  setPriceRange,
  toggleBrand,
  toggleCategory,
  toggleColor,
  toggleRating,
  toggleService,
} from "../reducer/filterActions";

import FilterByCategories from "./filterComponents/FilterByCategories";
import FilterByReview from "./filterComponents/FilterByReview";
import FilterByPrice from "./filterComponents/FilterByPrice";
import FilterByColor from "./filterComponents/FilterByColor";
import FilterByBrand from "./filterComponents/FilterByBrand";
import FilterByService from "./filterComponents/FilterByService";

export default function CollapseFilterPanel({
  state,
  dispatch,
  getFilterCount,
}: {
  state: FilterState;
  dispatch: Dispatch<FilterAction>;
  getFilterCount: (fn: (product: Product) => boolean) => number;
}) {
  return (
    <div className="row row--24 mt_dec--24">
      <div className="col-xxl-3 col-xl-3 col-lg-3 col-md-6 col-sm-6 col-6 mt--24">
        <CollapseFilterWidget title="Categories">
          <ul className="rbt-sidebar-list-wrapper rbt-categories-list-check">
            <FilterByCategories
              selectedItems={state.categories}
              getFilterCount={getFilterCount}
              onChange={(value) =>
                toggleCategory(value, dispatch, state.categories)
              }
            />
          </ul>
        </CollapseFilterWidget>
      </div>

      <div className="col-xxl-3 col-xl-3 col-lg-3 col-md-6 col-sm-6 col-6 mt--24">
        <CollapseFilterWidget title="Filter by price">
          <FilterByPrice
            getFilterCount={getFilterCount}
            priceRange={state.price}
            onChange={(value) => setPriceRange(value, dispatch)}
          />
        </CollapseFilterWidget>
      </div>

      <div className="col-xxl-3 col-xl-3 col-lg-3 col-md-6 col-sm-6 col-6 mt--24">
        <CollapseFilterWidget title="Filter by color">
          <div className="rbt-inner-search-field border-0 pt--16 pb--16">
            <div className="rbt-search-input-section rbt-sm-search-section">
              <input
                className="rbt-filter-search-field"
                type="text"
                placeholder="Search and Select Product"
                aria-label="Search color"
              />
              <span className="search-btn search-btn-dark bg-transparent rbt-text-color-gray-400">
                <i className="fa-sharp fa-solid fa-magnifying-glass" />
              </span>
            </div>
          </div>
          <div className="rbt-widget-content rbt-scroll-content">
            <FilterByColor
              getFilterCount={getFilterCount}
              selectedItems={state.colors}
              onChange={(value) => toggleColor(value, dispatch, state.colors)}
            />
          </div>
        </CollapseFilterWidget>
      </div>

      <div className="col-xxl-3 col-xl-3 col-lg-3 col-md-6 col-sm-6 col-6 mt--24">
        <CollapseFilterWidget title="Brand">
          <ul className="rbt-sidebar-list-wrapper rbt-categories-list-check rbt-categories-brand-list-check">
            <FilterByBrand
              getFilterCount={getFilterCount}
              selectedItems={state.brands}
              onChange={(value) => toggleBrand(value, dispatch, state.brands)}
            />
          </ul>
        </CollapseFilterWidget>
      </div>

      <div className="col-xxl-3 col-xl-3 col-lg-3 col-md-6 col-sm-6 col-6 mt--24">
        <CollapseFilterWidget title="Customer Reviews">
          <ul className="rbt-sidebar-list-wrapper rbt-categories-review-list">
            <FilterByReview
              selectedItems={state.ratings}
              onChange={(value) => toggleRating(value, dispatch, state.ratings)}
            />
          </ul>
        </CollapseFilterWidget>
      </div>

      <div className="col-xxl-3 col-xl-3 col-lg-3 col-md-6 col-sm-6 col-6 mt--24">
        <CollapseFilterWidget title="Promotion &amp; Services">
          <div className="rbt-sidebar-list-wrapper rbt-tag-list justify-content-start pt--0">
            <FilterByService
              selectedItems={state.services}
              onChange={(value) =>
                toggleService(value, dispatch, state.services)
              }
            />
          </div>
        </CollapseFilterWidget>
      </div>
    </div>
  );
}

function CollapseFilterWidget({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rbt-single-widget rbt-widget-categories">
      <div className="bt-single-widget-inner">
        <h4 className="rbt-widget-title rbt-widget-title-without-border mb--16">
          {title}
        </h4>
        <div className="rbt-widget-content">{children}</div>
      </div>
    </div>
  );
}

