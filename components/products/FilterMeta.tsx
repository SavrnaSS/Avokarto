"use client";

import { Dispatch } from "react";
import {
  clearAllFilters,
  setPriceRange,
  toggleBrand,
  toggleCategory,
  toggleColor,
  toggleRating,
  toggleService,
  toggleTag,
} from "../reducer/filterActions";
import { FilterState, FilterAction } from "@/types";

export default function FilterMeta({
  state,
  dispatch,
}: {
  state: FilterState;
  dispatch: Dispatch<FilterAction>;
}) {
  const isDefaultPrice = state.price[0] === 0 && state.price[1] === 1000;

  const isFilterActive = () => {
    return (
      state.tags.length > 0 ||
      state.colors.length > 0 ||
      state.categories.length > 0 ||
      state.brands.length > 0 ||
      state.ratings.length > 0 ||
      state.services.length > 0 ||
      !isDefaultPrice
    );
  };

  if (!isFilterActive()) return null; // Don't render anything if all filters are reset

  return (
    <div
      className={`rbt-shop-filter-tag-list rbt-tag-list rbt-tag-list-sm rbt-tag-list-bg-var-one rbt-tag-list-rounded rbt-tag-cancel-var ${state.tags.length > 0 ? "mt--20" : ""}`}
    >
      {state.tags.map((t) => (
        <button
          type="button"
          className="rbt-text-capitalize"
          key={t}
          onClick={() => {
            toggleTag(t, dispatch, state.tags);
          }}
        >
          {t}
          <i className="fa-solid fa-xmark" />
        </button>
      ))}

      {state.colors.map((color) => (
        <button
          type="button"
          className="rbt-text-capitalize"
          key={color}
          onClick={() => {
            toggleColor(color, dispatch, state.colors);
          }}
        >
          {color}
          <i className="fa-solid fa-xmark" />
        </button>
      ))}

      {state.categories.map((category) => (
        <button
          type="button"
          className="rbt-text-capitalize"
          key={category}
          onClick={() => {
            toggleCategory(category, dispatch, state.categories);
          }}
        >
          {category}
          <i className="fa-solid fa-xmark" />
        </button>
      ))}

      {state.brands.map((brand) => (
        <button
          type="button"
          className="rbt-text-capitalize"
          key={brand}
          onClick={() => {
            toggleBrand(brand, dispatch, state.brands);
          }}
        >
          {brand}
          <i className="fa-solid fa-xmark" />
        </button>
      ))}

      {state.ratings.map((rating) => (
        <button
          type="button"
          className="rbt-text-capitalize"
          key={rating}
          onClick={() => {
            toggleRating(rating, dispatch, state.ratings);
          }}
        >
          {rating} star up
          <i className="fa-solid fa-xmark" />
        </button>
      ))}

      {!isDefaultPrice && (
        <button
          type="button"
          className="rbt-text-capitalize"
          onClick={() => {
            setPriceRange([20, 300], dispatch);
          }}
        >
          ${state.price[0]} to ${state.price[1]}
          <i className="fa-solid fa-xmark" />
        </button>
      )}

      {state.services.map((service) => (
        <button
          type="button"
          className="rbt-text-capitalize"
          key={service}
          onClick={() => {
            toggleService(service, dispatch, state.services);
          }}
        >
          {service}
          <i className="fa-solid fa-xmark" />
        </button>
      ))}

      <button
        type="button"
        className="text-decoration-underline rbt-text-capitalize"
        onClick={() => {
          clearAllFilters(dispatch);
        }}
      >
        Clear All
      </button>
    </div>
  );
}
