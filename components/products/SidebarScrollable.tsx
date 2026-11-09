"use client";
import { Dispatch } from "react";
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
import { FilterState, FilterAction } from "@/types";
import { Product } from "@/types";
export default function SidebarScrollable({ state, dispatch, getFilterCount, sourceProducts = [] }: { state: FilterState; dispatch: Dispatch<FilterAction>; getFilterCount: (fn: (product: Product) => boolean) => number; sourceProducts?: Product[] }) {
  return (
    <div className="rbt-sidebar-bottom">
      {/* Start Widget Area  */}
      <div className="rbt-single-widget rbt-widget-categories">
        <div className="bt-single-widget-inner">
          <h4 className="rbt-widget-title rbt-widget-title-without-border mb--16">
            Categories
          </h4>
          <div className="rbt-scroll-content">
            <ul className="rbt-sidebar-list-wrapper rbt-categories-list-check">
              <FilterByCategories
                selectedItems={state.categories}
                getFilterCount={getFilterCount}
                onChange={(value) =>
                  toggleCategory(value, dispatch, state.categories)
                }
              />
            </ul>
          </div>
        </div>
      </div>
      {/* End Widget Area  */}
      {/* Start Widget Area  */}
      <div className="rbt-single-widget rbt-widget-categories">
        <div className="bt-single-widget-inner">
          <h4 className="rbt-widget-title rbt-widget-title-without-border mb--16">
            Customer Reviews
          </h4>
          <div className="rbt-scroll-content">
            <ul className="rbt-sidebar-list-wrapper rbt-categories-review-list">
              <FilterByReview
                selectedItems={state.ratings}
                onChange={(value) =>
                  toggleRating(value, dispatch, state.ratings)
                }
              />
            </ul>
          </div>
        </div>
      </div>
      {/* End Widget Area  */}
      {/* Start Widget Area  */}
      <div className="rbt-single-widget rbt-widget-categories">
        <div className="bt-single-widget-inner">
          <h4 className="rbt-widget-title rbt-widget-title-without-border mb--16">
            Filter by price
          </h4>
          <div className="rbt-scroll-content">
            <FilterByPrice
              getFilterCount={getFilterCount}
              priceRange={state.price}
              onChange={(value) => setPriceRange(value, dispatch)}
            />
          </div>
        </div>
      </div>
      {/* End Widget Area  */}
      {/* Start Widget Area  */}
      <div className="rbt-single-widget rbt-widget-categories">
        <div className="bt-single-widget-inner">
          <h4 className="rbt-widget-title rbt-widget-title-without-border pb--0">
            Filter by color
          </h4>
          <div className="rbt-inner-search-field border-0 pt--16 pb--16">
            <div className="rbt-search-input-section rbt-sm-search-section">
              <input
                className="rbt-filter-search-field"
                type="text"
                placeholder="Search and Select Product"
              />
              <span className="search-btn search-btn-dark bg-transparent rbt-text-color-gray-400">
                <i className="fa-sharp fa-solid fa-magnifying-glass" />
              </span>
            </div>
          </div>
          <div className="rbt-scroll-content">
            <FilterByColor
              scrollAble
              getFilterCount={getFilterCount}
              selectedItems={state.colors}
              onChange={(value) => toggleColor(value, dispatch, state.colors)}
              sourceProducts={sourceProducts}
            />
          </div>
        </div>
      </div>
      {/* End Widget Area  */}
      {/* Start Widget Area  */}
      <div className="rbt-single-widget rbt-widget-categories">
        <div className="bt-single-widget-inner">
          <h4 className="rbt-widget-title rbt-widget-title-without-border mb--16">
            Brand
          </h4>
          <div className="rbt-scroll-content">
            <ul className="rbt-sidebar-list-wrapper rbt-categories-list-check rbt-categories-brand-list-check">
              <FilterByBrand
                getFilterCount={getFilterCount}
                selectedItems={state.brands}
                onChange={(value) => toggleBrand(value, dispatch, state.brands)}
              />
            </ul>
          </div>
        </div>
      </div>
      {/* End Widget Area  */}
      {/* Start Widget Area  */}
      <div className="rbt-single-widget rbt-widget-categories">
        <div className="bt-single-widget-inner">
          <h4 className="rbt-widget-title rbt-widget-title-without-border">
            Promotion &amp; Services
          </h4>
          <div className="rbt-scroll-content">
            <div className="rbt-sidebar-list-wrapper rbt-tag-list justify-content-start pt--0">
              <FilterByService
                selectedItems={state.services}
                onChange={(value) =>
                  toggleService(value, dispatch, state.services)
                }
                sourceProducts={sourceProducts}
              />
            </div>
          </div>
        </div>
      </div>
      {/* End Widget Area  */}
    </div>
  );
}
