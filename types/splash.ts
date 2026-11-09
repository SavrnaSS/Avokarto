export interface SplashDemoData {
  id: number;
  title: string;
  href: string;
  image: string;
  mobileImage: string;
  tags: string[];
  features: string[];
  cardClass: string;
  filterClass: string[];
  isNew?: boolean;
  comingSoon?: boolean;
}

export interface SplashFilter {
  label: string;
  filter: string;
  count: string;
}

export interface VariationCard {
  href: string;
  colorVar: string;
  image: string;
  width: number;
  height: number;
  title: string;
  subtitle: string;
}

export interface FeatureCard {
  image: string;
  width: number;
  height: number;
  cardBg: string;
  title: string;
  description: string;
}

export interface PluginItem {
  image: string;
  width: number;
  height: number;
  title: string;
  badge: string;
  parallaxY: number;
}

export interface PluginTableRow {
  feature: string;
  cost: string;
  cr: string;
}

export interface FaqItem {
  id: string;
  headingId: string;
  question: string;
  answer: FaqAnswerPart[];
  defaultOpen?: boolean;
}

export type FaqAnswerPart =
  | { type: "text"; value: string }
  | { type: "link"; label: string; href: string; external?: boolean }
  | { type: "code"; value: string };

export interface BlocsImageEntry {
  href: string;
  src: string;
  width: number;
  height: number;
}

export interface FilterVariation {
  id: string;
  count: string;
  title: string;
  desc: string;
  imgSrc: string;
  imgWidth: number;
  imgHeight: number;
  href?: string;
  contentRight?: boolean;
  isSmall?: boolean;
}

export interface PopupVariation {
  id: string;
  count: string;
  title: string;
  desc: string;
  imgSrc?: string;
  videoSrc?: string;
  imgWidth?: number;
  imgHeight?: number;
  href?: string;
  contentRight?: boolean;
  isSmall?: boolean;
}
