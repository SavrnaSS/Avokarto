export interface ReviewMediaItem {
  id: string;
  type: "image" | "video";
  src: string;
  thumbSrc: string;
  alt: string;
}

export interface ProductFeature {
  id: string;
  title: string;
  desc: string;
  imgSrc?: string;
  icon?: string;
}

export interface ProductSpecification {
  id: string;
  label: string;
  value: string;
}

export interface ReviewComment {
  id: number;
  author: string;
  imgSrc: string;
  rating: number;
  date: string;
  title: string;
  desc: string;
  hasMedia?: boolean;
}

export interface ProductFaq {
  id: string;
  question: string;
  answer: string;
}
