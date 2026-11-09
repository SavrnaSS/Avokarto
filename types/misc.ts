import type { ReactNode } from "react";
import type { ModalNameType } from "./modal";

export type VideoSectionItem = {
  imgSrc: string;
  username: string;
  caption: string;
};

export interface ToolbarItem {
  id: string;
  label: string;
  icon: string;
  href?: string;
  modalTarget?: ModalNameType;
  countComponent?: ReactNode;
  isButton?: boolean;
}

export type PricingFeature = {
  text: string;
  included: boolean;
};

export type PricingPlan = {
  title: string;
  badgeText: string;
  yearlyPrice: number;
  monthlyPrice: number;
  features: PricingFeature[];
  isActive?: boolean;
  pricingBadge?: string;
  titleColorClassName?: string;
  amountColorClassName?: string;
  durationColorClassName?: string;
};

export type InnerPageItem = {
  type: "product" | "shop" | "others" | "blog";
  href: string;
  title: string;
  image: {
    src: string;
    width: number;
    height: number;
  };
  badge?: { text: string; className: string };
  outerBaseClassName?: string;
  outerExtraClassName?: string;
};

export type ImageGallaryItem = {
  src: string;
  alt: string;
  width: number;
  height: number;
  id?: number;
};

export type BentoGridImageGallaryData = {
  left: ImageGallaryItem;
  right: Array<ImageGallaryItem>;
};

export type AboutFactItem = {
  count: number;
  dataText: string;
  description: string;
  hasFormattingMark?: boolean;
};

export interface CategorySidebarItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  badge?: {
    text: string;
    class: string;
  };
  subCategories: {
    id: string;
    title: string;
    image: string;
    links: {
      title: string;
      url: string;
    }[];
  }[];
  banner?: {
    image: string;
    text: string;
    highlight: string;
    title: string;
    subtitle: string;
    buttonText: string;
    buttonUrl: string;
  };
}

export interface SocialLink {
  id: string;
  name: string;
  url: string;
  icon: string;
  className: string;
}

export interface SizeGuideRow {
  id: string;
  size: string;
  usSize: string;
  chest: string;
  waist: string;
  lowHip: string;
  inseam: string;
}

export interface KeyFeature {
  id: string;
  preTitle: string;
  title: string;
  items: { icon: string; text: string; marquee?: boolean }[];
  thumbSrc: string;
  cardVariation: string;
}

export interface ElevateFeature {
  id: string;
  type: number;
  preTitle?: string;
  title: string;
  desc?: string;
  mainImg: string;
  icons?: { src: string; className: string; width: number; height: number }[];
  cardClass: string;
}

export interface OceanTemplateSlide {
  id: string;
  preTitle: string;
  title: string;
  desc: string;
  imgSrc: string;
}

export interface Comment {
  id: string;
  author: string;
  imgSrc: string;
  date: string;
  content: string;
  replies?: Comment[];
}

export interface OfferCardItem {
  id: string;
  title: string;
  desc: string;
  imgSrc: string;
  dateRange: string;
  href: string;
}

export interface CouponItem {
  id: string;
  code: string;
  title: string;
  subtitle: string;
  validity: string;
  minSpend: string;
}
