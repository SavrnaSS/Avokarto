export interface HeroSlide {
  id?: number;
  title?: string;
  subtitle?: string;
  description?: string;

  imgSrc?: string;
  width?: number;
  height?: number;
  oldPrice?: number;
  price?: number;
  discount?: string;
  offer?: string;
  saveOffer?: string;
  discountText?: string;
  productTitle?: string;
  bgImgSrc?: string;
  bgImgWidth?: number;
  bgImgHeight?: number;

  alt?: string;

  effectName?: "zoomOut" | "fadeInDown" | "fadeInUp" | "zoomIn";
  countdownDate?: string;
}
