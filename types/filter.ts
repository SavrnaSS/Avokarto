import { Product } from "./product";

export type SortingOption =
  | "Sort by (Default)"
  | "Price Ascending"
  | "Price Descending"
  | "Title Ascending"
  | "Title Descending"
  | string;

export interface FilterState {
  price: [number, number];
  colors: string[];
  size: string;
  tags: string[];
  activeFilterOnSale: boolean;
  activeFilterInStock: boolean;
  brands: string[];
  categories: string[];
  ratings: number[];
  services: string[];
  filtered: Product[];
  sortingOption: SortingOption;
  sorted: Product[];
  currentPage: number;
  itemPerPage: number;
  customMin?: number;
  customMax?: number;
}

export type FilterAction =
  | { type: "SET_PRICE"; payload: [number, number] }
  | { type: "SET_CUSTOM_MIN"; payload: number }
  | { type: "SET_CUSTOM_MAX"; payload: number }
  | { type: "SET_COLORS"; payload: string[] }
  | { type: "SET_TAGS"; payload: string[] }
  | { type: "SET_SIZE"; payload: string }
  | { type: "SET_BRANDS"; payload: string[] }
  | { type: "SET_CATEGORIES"; payload: string[] }
  | { type: "SET_RATINGS"; payload: number[] }
  | { type: "SET_SERVICES"; payload: string[] }
  | { type: "SET_CURRENT_PAGE"; payload: number }
  | { type: "SET_ITEM_PER_PAGE"; payload: number }
  | { type: "FILTER_PRODUCTS"; payload: Product[]; preservePage?: boolean }
  | { type: "SET_SORTING_OPTION"; payload: SortingOption }
  | { type: "SORT_PRODUCTS"; preservePage?: boolean }
  | { type: "TOGGLE_FILTER_ON_SALE" }
  | { type: "TOGGLE_FILTER_IN_STOCK" }
  | { type: "CLEAR_FILTER" };
