import { FilterState, FilterAction, Product } from "@/types";

export const initialState: FilterState = {
  price: [0, 1000],
  colors: [], // changed from single "color"
  size: "All",
  tags: [],
  activeFilterOnSale: false,
  activeFilterInStock: false,
  brands: [],
  categories: [],
  ratings: [], // e.g. [4, 3]
  services: [], // e.g. ['Free Delivery', 'Hot Deals']
  filtered: [],
  sortingOption: "Sort by (Default)",
  sorted: [],
  currentPage: 1,
  itemPerPage: 15,
};

// Exact match (case/whitespace-insensitive), not fuzzy substring/singular-
// form guessing - that heuristic only existed to paper over a hardcoded
// category list that didn't match the real catalog (see
// FilterByCategories.tsx, which uses the same rule). Category names now
// come from the same admin-managed table that populates
// product.category/filterCategory, so this is both correct and reliable.
function matchesCategory(product: Product, category: string): boolean {
  const normalized = category.trim().toLowerCase();
  const productCategories = [
    ...(product.filterCategory ?? []),
    ...(product.category ?? []),
  ].map((item) => item.trim().toLowerCase());

  return productCategories.includes(normalized);
}

function matchesAllFilters(product: Product, state: FilterState): boolean {
  if (
    state.brands.length &&
    !state.brands.some((b) => product.filterBrands?.includes(b))
  )
    return false;

  if (
    state.categories.length &&
    !state.categories.some((category) => matchesCategory(product, category))
  )
    return false;

  if (state.tags.length && !state.tags.some((t) => product.tags?.includes(t)))
    return false;

  if (
    state.colors.length &&
    !state.colors.some((color) => product.filterColor?.includes(color))
  )
    return false;

  const effectiveMin = state.price[0];
  const effectiveMax = state.price[1];
  if (product.price < effectiveMin || product.price > effectiveMax)
    return false;

  if (
    state.ratings.length &&
    !state.ratings.some((minRating) => product.rating ?? 0 >= minRating)
  )
    return false;

  if (
    state.services.length &&
    !state.services.some((s) => product.services?.includes(s))
  )
    return false;

  if (state.activeFilterOnSale && (product.oldPrice == null || product.oldPrice <= product.price))
    return false;

  if (state.activeFilterInStock) {
    const isInStock =
      product.inStock === true ||
      product.isStockOut === false ||
      (product.inStock == null && product.isStockOut == null);
    if (!isInStock) return false;
  }

  return true;
}

export function reducer(state: FilterState, action: FilterAction): FilterState {
  switch (action.type) {
    case "SET_PRICE":
      return { ...state, price: action.payload };

    case "SET_CUSTOM_MIN":
      return { ...state, customMin: action.payload };

    case "SET_CUSTOM_MAX":
      return { ...state, customMax: action.payload };

    case "SET_COLORS":
      return { ...state, colors: action.payload };
    case "SET_TAGS":
      return { ...state, tags: action.payload };
    case "SET_SIZE":
      return { ...state, size: action.payload };

    case "SET_BRANDS":
      return { ...state, brands: action.payload };

    case "SET_CATEGORIES":
      return { ...state, categories: action.payload };

    case "SET_RATINGS":
      return { ...state, ratings: action.payload };

    case "SET_SERVICES":
      return { ...state, services: action.payload };
    case "SET_CURRENT_PAGE":
      return { ...state, currentPage: action.payload };

    case "SET_ITEM_PER_PAGE":
      return { ...state, itemPerPage: action.payload, currentPage: 1 };

    case "FILTER_PRODUCTS": {
      const productsToFilter = [...action.payload];
      const filtered = productsToFilter.filter((product) =>
        matchesAllFilters(product, state),
      );
      return {
        ...state, filtered,
        currentPage: action.preservePage
          ? Math.min(state.currentPage, Math.max(1, Math.ceil(filtered.length / state.itemPerPage)))
          : 1,
      };
    }

    case "SET_SORTING_OPTION":
      return { ...state, sortingOption: action.payload };

    case "SORT_PRODUCTS": {
      const sorted = [...state.filtered];
      switch (state.sortingOption) {
        case "Price Ascending":
          sorted.sort((a, b) => a.price - b.price);
          break;
        case "Price Descending":
          sorted.sort((a, b) => b.price - a.price);
          break;
        case "Title Ascending":
          sorted.sort((a, b) => a.title.localeCompare(b.title));
          break;
        case "Title Descending":
          sorted.sort((a, b) => b.title.localeCompare(a.title));
          break;
        default:
          break;
      }
      return { ...state, sorted, currentPage: action.preservePage ? state.currentPage : 1 };
    }

    case "TOGGLE_FILTER_ON_SALE":
      return { ...state, activeFilterOnSale: !state.activeFilterOnSale };

    case "TOGGLE_FILTER_IN_STOCK":
      return { ...state, activeFilterInStock: !state.activeFilterInStock };

    case "CLEAR_FILTER":
      return {
        ...state,
        price: [0, 1000],

        colors: [], // changed from single "color"
        size: "All",
        tags: [],
        activeFilterOnSale: false,
        activeFilterInStock: false,
        brands: [],
        categories: [],
        ratings: [], // e.g. [4, 3]
        services: [], // e.g. ['Free Delivery', 'Hot Deals']

        sortingOption: "Sort by (Default)",
      };

    default:
      return state;
  }
}
