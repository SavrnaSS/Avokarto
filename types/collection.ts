export interface Collection {
  id?: number;
  title?: string;
  category?: string;

  imgSrc?: string;
  productCount?: number;
  width?: number;
  height?: number;
  subtitle?: string;

  savePercent?: string;

  hasCurvedPortion?: boolean;
  alt?: string;
  bgClass?: string;
  description?: string;
  discount?: string;

  productTitle?: string;
  oldPrice?: number;
  price?: number;

  effectClass?: string;
  effectName?: "zoomOut" | "fadeInDown" | "fadeInUp" | "zoomIn";

  offer?: string;
  bgImgSrc?: string;
  bgImgWidth?: number;
  bgImgHeight?: number;
}
