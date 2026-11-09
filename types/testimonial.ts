import type { Product } from "./product";

export interface Testimonial {
  id?: number;
  title?: string;
  date?: string;
  rating?: number;
  text?: string;
  content?: string;
  name?: string;
  author?: string;
  reviewer?: string;
  verified?: boolean;
  imgSrc?: string;
  thumbnail?: string;
  product?: Product;
  order?: number;
  role?: string;
  animation?: number | string;
  reviewerImage?: string;
  fullStarCount?: number;
  videoSrc?: string;
  reviewText?: string;
}
