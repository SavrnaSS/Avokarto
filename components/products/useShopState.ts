"use client";

import { useEffect, useMemo, useReducer, useRef } from "react";
import { initialState, reducer } from "../reducer/filterReducer";
import { electronicsCardData } from "@/data/products/electronics";
import type { FilterState, Product } from "@/types";

type LoaderType = "pagination" | "button" | "infinite";

type UseShopStateOptions = {
  column: number;
  loaderType?: LoaderType | string;
  defaultTags?: string[];
  defaultCategories?: string[];
  itemPerPage?: number;
  products?: Product[];
};

export function useShopState({
  column,
  loaderType = "pagination",
  defaultTags = [],
  defaultCategories = [],
  itemPerPage = 0,
  products,
}: UseShopStateOptions) {
  const sourceProducts = (products ?? electronicsCardData) as Product[];
  const [state, dispatch] = useReducer(reducer, {
    ...initialState,
    filtered: sourceProducts,
    sorted: sourceProducts,
    itemPerPage: itemPerPage
      ? itemPerPage
      : column >= 4
        ? column * 3
        : column * 5,
    tags: defaultTags,
    categories: defaultCategories,
  }, (state) => reducer(
    reducer(state, { type: "FILTER_PRODUCTS", payload: sourceProducts }),
    { type: "SORT_PRODUCTS" },
  ));

  const isLoadMore = loaderType === "button" || loaderType === "infinite";
  const filterKey = JSON.stringify([
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
  const previousFilterKey = useRef(filterKey);
  const previousSorting = useRef(state.sortingOption);

  useEffect(() => {
    dispatch({
      type: "FILTER_PRODUCTS", payload: sourceProducts,
      preservePage: isLoadMore && previousFilterKey.current === filterKey,
    });
    previousFilterKey.current = filterKey;
  }, [filterKey, sourceProducts, isLoadMore]);

  useEffect(() => {
    dispatch({ type: "SORT_PRODUCTS", preservePage: isLoadMore && previousSorting.current === state.sortingOption });
    previousSorting.current = state.sortingOption;
  }, [isLoadMore, state.sortingOption, state.filtered]);

  const visibleProducts = useMemo(() => {
    if (isLoadMore) {
      return state.sorted.slice(0, state.currentPage * state.itemPerPage);
    }
    return state.sorted.slice(
      (state.currentPage - 1) * state.itemPerPage,
      state.currentPage * state.itemPerPage,
    );
  }, [state.sorted, state.currentPage, state.itemPerPage, isLoadMore]);

  function getFilterCount(filterFunction: (product: Product) => boolean) {
    return sourceProducts.filter((product) => filterFunction(product)).length;
  }

  return {
    state: state as FilterState,
    dispatch,
    visibleProducts,
    getFilterCount: getFilterCount as (
      fn: (product: Product) => boolean,
    ) => number,
    isLoadMore,
    sourceProducts,
  };
}
