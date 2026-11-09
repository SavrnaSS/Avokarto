import { FilterAction, SortingOption, Product } from "@/types";
import { Dispatch } from "react";

// Add or remove a brand
export function toggleBrand(brand: string, dispatch: Dispatch<FilterAction>, selectedBrands: string[]): void {
  const updated = selectedBrands.includes(brand)
    ? selectedBrands.filter((b) => b !== brand)
    : [...selectedBrands, brand];
  dispatch({ type: "SET_BRANDS", payload: updated });
}

// Add or remove a category
export function toggleCategory(category: string, dispatch: Dispatch<FilterAction>, selectedCategories: string[]): void {
  const normalized = category.trim().toLowerCase();
  const isSelected = (name: string) => name.trim().toLowerCase() === normalized;
  const updated = selectedCategories.some(isSelected)
    ? selectedCategories.filter((name) => !isSelected(name))
    : [...selectedCategories, category];
  dispatch({ type: "SET_CATEGORIES", payload: updated });
}

// Add or remove a color
export function toggleColor(color: string, dispatch: Dispatch<FilterAction>, selectedColors: string[]): void {
  const updated = selectedColors.includes(color)
    ? selectedColors.filter((c) => c !== color)
    : [...selectedColors, color];

  dispatch({ type: "SET_COLORS", payload: updated });
}

// Add or remove a rating
export function toggleRating(rating: number, dispatch: Dispatch<FilterAction>, selectedRatings: number[]): void {
  const updated = selectedRatings.includes(rating)
    ? selectedRatings.filter((r) => r !== rating)
    : [...selectedRatings, rating];
  dispatch({ type: "SET_RATINGS", payload: updated });
}

// Add or remove a service
export function toggleService(service: string, dispatch: Dispatch<FilterAction>, selectedServices: string[]): void {
  const updated = selectedServices.includes(service)
    ? selectedServices.filter((s) => s !== service)
    : [...selectedServices, service];
  dispatch({ type: "SET_SERVICES", payload: updated });
}

// Add or remove a tag
export function toggleTag(tag: string, dispatch: Dispatch<FilterAction>, selectedTags: string[]): void {
  const updated = selectedTags.includes(tag)
    ? selectedTags.filter((t) => t !== tag)
    : [...selectedTags, tag];

  dispatch({ type: "SET_TAGS", payload: updated });
}

// Set size
export function setSize(size: string, dispatch: Dispatch<FilterAction>): void {
  dispatch({ type: "SET_SIZE", payload: size });
}

// Toggle on-sale filter
export function toggleOnSale(dispatch: Dispatch<FilterAction>): void {
  dispatch({ type: "TOGGLE_FILTER_ON_SALE" });
}

// Toggle in-stock filter
export function toggleInStock(dispatch: Dispatch<FilterAction>): void {
  dispatch({ type: "TOGGLE_FILTER_IN_STOCK" });
}

// Set fixed price range
export function setPriceRange(range: [number, number], dispatch: Dispatch<FilterAction>): void {
  dispatch({ type: "SET_PRICE", payload: range }); // [min, max]
}

// Set sorting
export function setSorting(option: SortingOption, dispatch: Dispatch<FilterAction>): void {
  dispatch({ type: "SET_SORTING_OPTION", payload: option });
}

// Apply filtering (must pass full data)
export function applyFilter(data: Product[], dispatch: Dispatch<FilterAction>): void {
  dispatch({ type: "FILTER_PRODUCTS", payload: data });
  dispatch({ type: "SORT_PRODUCTS" });
}

// Reset all
export function clearAllFilters(dispatch: Dispatch<FilterAction>): void {
  dispatch({ type: "CLEAR_FILTER" });
}

// Set current page
export function setCurrentPage(page: number, dispatch: Dispatch<FilterAction>): void {
  dispatch({ type: "SET_CURRENT_PAGE", payload: page });
}

// Set items per page
export function setItemPerPage(count: number, dispatch: Dispatch<FilterAction>): void {
  dispatch({ type: "SET_ITEM_PER_PAGE", payload: count });
}
