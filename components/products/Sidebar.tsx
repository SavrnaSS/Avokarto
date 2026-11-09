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
export default function Sidebar({
  state,
  dispatch,
  getFilterCount,
  sourceProducts = [],
}: {
  state: FilterState;
  dispatch: Dispatch<FilterAction>;
  getFilterCount: (fn: (product: Product) => boolean) => number;
  sourceProducts?: Product[];
}) {
  return (
    <div className="rbt-sidebar-bottom">
      {/* Start Widget Area  */}
      <div className="rbt-single-widget rbt-widget-categories">
        <div className="bt-single-widget-inner">
          <h4 className="rbt-widget-title rbt-widget-title-without-border">
            <a
              data-bs-toggle="collapse"
              href="#rbt-collapse-3"
              role="button"
              aria-expanded="false"
              aria-controls="rbt-collapse-3"
            >
              Categories
              <span className="icon">
                <i className="fa-regular fa-chevron-down" />
              </span>
            </a>
          </h4>
          <div className="collapse show" id="rbt-collapse-3">
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
          <h4 className="rbt-widget-title rbt-widget-title-without-border">
            <a
              data-bs-toggle="collapse"
              href="#rbt-collapse-6"
              role="button"
              aria-expanded="false"
              aria-controls="rbt-collapse-6"
            >
              Customer Reviews
              <span className="icon">
                <i className="fa-regular fa-chevron-down" />
              </span>
            </a>
          </h4>
          <div className="collapse show" id="rbt-collapse-6">
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
          <h4 className="rbt-widget-title rbt-widget-title-without-border">
            <a
              data-bs-toggle="collapse"
              href="#rbt-collapse-7"
              role="button"
              aria-expanded="false"
              aria-controls="rbt-collapse-7"
            >
              Filter by price
              <span className="icon">
                <i className="fa-regular fa-chevron-down" />
              </span>
            </a>
          </h4>
          <div className="collapse show" id="rbt-collapse-7">
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
            <a
              data-bs-toggle="collapse"
              href="#rbt-collapse-8"
              role="button"
              aria-expanded="false"
              aria-controls="rbt-collapse-8"
            >
              Filter by color
              <span className="icon">
                <i className="fa-regular fa-chevron-down" />
              </span>
            </a>
          </h4>
          <div className="collapse show" id="rbt-collapse-8">
            <FilterByColor
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
          <h4 className="rbt-widget-title rbt-widget-title-without-border">
            <a
              data-bs-toggle="collapse"
              href="#rbt-collapse-9"
              role="button"
              aria-expanded="false"
              aria-controls="rbt-collapse-9"
            >
              Brand
              <span className="icon">
                <i className="fa-regular fa-chevron-down" />
              </span>
            </a>
          </h4>
          <div className="collapse show" id="rbt-collapse-9">
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
            <a
              data-bs-toggle="collapse"
              href="#rbt-collapse-10"
              role="button"
              aria-expanded="false"
              aria-controls="rbt-collapse-10"
            >
              Promotion &amp; Services
              <span className="icon">
                <i className="fa-regular fa-chevron-down" />
              </span>
            </a>
          </h4>
          <div className="collapse show" id="rbt-collapse-10">
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
