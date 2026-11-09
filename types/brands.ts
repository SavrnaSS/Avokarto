export interface Brand {
  /**
   * Brand identifiers are inconsistent across datasets (number ids, string ids,
   * or letter section ids for the brand list page).
   */
  id?: number;

  /** Display name (e.g. in brand list). */
  // name?: string;

  /** Display title (e.g. brand card title or section title). */
  title?: string;

  /** Generic image source used by multiple brand widgets. */
  // src?: string;

  /** Alternate image keys used across the project. */
  imgSrc?: string;
  logoSrc?: string;
  width?: number;
  height?: number;

  /** Marketing/meta fields used by some brand widgets. */
  discount?: string;
  productCount?: number;
  location?: string;
  totalProducts?: number | string;

  /**
   * Brand list page structure: each "section" contains columns of brands.
   * Using the same `Brand` type keeps the whole app on a single unified type.
   */
  columns?: Brand[][];
}
