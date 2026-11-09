// Product Badge Type
export interface ProductBadge {
  text: string;
  bg?: string;
  position?: string;
  className?: string;
}

// Product Variant Types
export interface ProductVariant {
  src?: string;
  color?: string;
  hex?: string;
  tooltip?: string;
  active?: boolean;
  imgSrc?: string;
}

export interface ColorVariant {
  color: string;
  src: string;
  tooltip: string;
}

// Extra Info Type
export interface ExtraInfo {
  icon: string;
  text: string;
}

// Pricing Badge Type
export interface PricingBadge {
  text: string | number;
  bg: string;
}

// Product Detail Type
export interface ProductDetail {
  label: string;
  text: string | string[];
}

// Shipment Detail Type
export interface ShipmentDetail {
  icon: string;
  label: string;
  text: string | null;
  link?: {
    href: string;
    text: string;
  };
}

// Countdown Type
export interface Countdown {
  date: string;
}

// Quantity Area Type
export interface QuantityArea {
  text: string | number;
  progress: number;
}

// Frame Slide Type
export interface FrameSlide {
  id?: number;
  imgSrc?: string;
  src?: string;
  imgAlt?: string;
  badges?: ProductBadge[];
  active?: boolean;
}

export interface ProductSellerPreview {
  count: number;
  top: { accentColor: string; handle: string; logoUrl: string; name: string }[];
}

// Main Product Type
export interface Product {
  // Core Fields
  id: number | string;
  title: string;
  price: number;
  imgSrc: string;

  // The real catalog UUID (products.id). `id` above prefers the numeric
  // legacy_id when one exists, for backward compatibility with the static
  // demo catalog's cart/wishlist/compare matching - so it isn't safe to use
  // as a foreign key into DB tables that reference products.id directly
  // (e.g. submitting a review). Only set for real, DB-backed products.
  catalogId?: string;

  // Merchant-managed identifiers exposed by the storefront product endpoint.
  // They are optional for the static demo catalog, which has no database row.
  sku?: string;
  brand?: string;

  // The merchant's real product description (admin > Products > edit >
  // General > Description). Plain text, not HTML - the admin's rich-text
  // toolbar is currently decorative only.
  description?: string;

  // A compact intro line shown above `description` on the product page's
  // Description tab (admin > Products > edit > Storefront Display > Short
  // Summary).
  shortSummary?: string;

  // Optional image shown right after the Short Summary text - admin uploads
  // a dedicated file (admin > Products > edit > Storefront Display > Short
  // Summary Image). Width/height are the uploaded file's real pixel
  // dimensions, captured at upload time so the storefront can render the
  // full image at its true aspect ratio instead of cropping it.
  shortSummaryImage?: string;
  shortSummaryImageHeight?: number | null;
  shortSummaryImageWidth?: number | null;

  // Short highlight bullets shown as cards on the Description tab (admin >
  // Products > edit > Storefront Display > Key Highlights, semicolon
  // separated).
  keyHighlights?: string[];

  // Raw "Label: value; Label: value" text from admin > Products > edit >
  // Product Specifications. Parsed into rows at render time (see
  // parseProductSpecifications in lib/productSpecifications.ts) rather than
  // stored pre-split, so the admin's exact free-text format round-trips
  // untouched.
  specifications?: string;

  // Product-specific FAQ entries shown on the Questions tab (admin >
  // Products > edit > Product Questions).
  faqs?: { question: string; answer: string }[];

  // The product's URL slug (products.slug - unique, human-readable, e.g.
  // "cowboy-cat-shirt"). Product detail links prefer this over the numeric/
  // UUID `id` so real product URLs read like /product/cowboy-cat-shirt
  // instead of a raw UUID. Only set for real, DB-backed products -
  // getStorefrontProduct() already resolves by slug, sku, id, or
  // legacy_id interchangeably, so this is purely a nicer link, not a new
  // lookup path.
  slug?: string;

  // Per-product search settings (admin > Products > SEO). Blank values mean
  // "derive from the product's own name/description" - see lib/seo.ts.
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
  seoNoindex?: boolean;
  // Alt text keyed by image URL (gallery reorders can't misattribute it).
  imageAlts?: Record<string, string>;
  // Validated GTIN (UPC/EAN/ISBN digits) and manufacturer part number.
  gtin?: string;
  mpn?: string;
  // Rating summary for search engines: approved reviews written by real
  // customer accounts only. Admin-entered or generated reviews are shown on
  // the page but never published as structured data (Google review-snippet
  // policy). Only set on the single-product detail query.
  verifiedRating?: {
    average: number;
    count: number;
    reviews: { author: string; body: string; datePublished: string; rating: number }[];
  };

  // Independent sellers who also carry this product in their own stores
  // (reseller listings): the total and up to three, busiest first, for the
  // avatar stack on shop cards. Only set on the shop listing query.
  sellers?: ProductSellerPreview;

  // Optional Core Fields
  oldPrice?: number | null;
  category?: string[];
  categorySlug?: string;
  rating?: number;
  ratingCount?: number;
  reviewCount?: number;

  // Badge Fields
  badge?: ProductBadge | null;
  badges?: ProductBadge[];

  // Image Fields
  hoverImgSrc?: string | null;
  hoverImg?: string;
  hoverVideoSrc?: string | null;

  // Pricing Fields
  discount?: number | null;
  discountPercentage?: number | null;
  priceRange?: string[];

  // Variant Fields
  variants?: ProductVariant[];
  colorVariants?: ColorVariant[];

  // UI Display Fields
  showTruckIcon?: boolean;
  hotSell?: boolean;
  moreText?: number;
  moreItemsLink?: number;
  moreVariantsText?: number;

  // Electronics Specific Fields
  extraInfo?: ExtraInfo[];
  pricingBadges?: PricingBadge[];
  productDetails?: ProductDetail[];
  shipmentDetails?: ShipmentDetail[];
  inStock?: boolean;
  availableQuantity?: number;
  filterBrands?: string[];
  filterCategory?: string[];
  filterColor?: string[];
  filterSizes?: string[];
  services?: string[];
  tags?: string[];
  isStockOut?: boolean;
  watchingTooltip?: number | null;
  countdown?: Countdown | null;
  quantityArea?: QuantityArea;
  listViewVariation?: string;

  // Lookbook Specific Fields
  bannerId?: number;
  bannerImg?: string;
  top?: number;
  left?: number;
  contentPosition?: string;
  animation?: string;
  bannerAnimation?: string;
  vertical?: number;
  horizontal?: number;
  placement?: string;

  // Book/Product Slide Fields
  subtitle?: string;
  titleSub?: string;

  // Compare Product Fields
  soldBy?: string;
  color?: string;
  fitType?: string;
  dimensions?: string;
  features?: string;

  // Image Dimension Fields
  width?: number;
  height?: number;
  imgWidth?: number;
  imgHeight?: number;

  // Bundle/Combo Fields
  quantity?: number;
  iconClass?: string;

  // Frame/Slide Fields
  frameSlides?: FrameSlide[];

  // Additional Optional Fields
  position?: string;

  // Demo / Tab Filtering
  demoTab?: string[];

  // Routing metadata
  detailsPageUrl?: string;
}

// Cart item: Product with required quantity
export interface CartProduct extends Product {
  quantity: number;
  // Set when the item was added from the bundle builder; items sharing a
  // bundleId get the bundle discount (see lib/bundleDiscount.ts).
  bundleId?: string;
  // Bought through a reseller store: charged that store's price, and the
  // reseller earns the margin (see lib/backend/resellers.ts).
  resellerListingId?: string;
  resellerStore?: { handle: string; name: string };
}
