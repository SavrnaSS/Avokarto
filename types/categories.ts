export interface Category {
  /** ids vary across datasets */
  id?: number;

  /** Title can be a string or pre-rendered node (some datasets use ReactNode). */
  title: string;

  subtitle?: string;
  mainTitle?: string;

  imgSrc: string;
  width?: number;
  height?: number;
  imgWidth?: number;
  imgHeight?: number;
  alt?: string;

  /** Optional background image fields used in some category cards */
  bgImg?: string;
  bgWidth?: number;
  bgHeight?: number;

  /** Legacy/variant flags */
  isWider?: boolean;
  // wider?: boolean;
  buttonMarquee?: boolean;

  badge?: { label?: string; color?: string };

  subCategories?: { title: string; href?: string }[];

  qty?: number | string;
}
