// Menu and navigation type definitions

export interface MenuItem {
  href: string;
  label: string;
  useLink?: boolean;
  badge?: string;
  badgeColor?: string;
  ml?: string | number | boolean;
  children?: MenuItem[];
  items?: MenuItem[];
  isNew?: boolean;
  isMegaMenu?: boolean;
  megaMenu?: MenuSection[];
}

export interface MenuSection {
  title: string;
  items: MenuItem[];
}

export interface DemoData {
  href: string;
  src: string;
  width: number;
  height: number;
  title: string;
}

export interface CategoryBanner {
  title: string;
  desc: string;
  btnHref: string;
  btnText: string;
  imgSrc: string;
  imgWidth: number;
  imgHeight: number;
  bannerCardClass?: string;
  bannerInnerClass?: string;
}

export interface CategoryMegamenu {
  label: string;
  icon: string;
  href: string;
  sections: MenuSection[];
  banner: CategoryBanner;
}

export interface CategorySimpleLink {
  href: string;
  label: string;
  icon: string;
}

export interface MegaMenuLink {
  label: string;
  href: string;
}

export interface MegaMenuColumn {
  title: string;
  links: MegaMenuLink[];
}

export interface MegaMenuBanner {
  title: string;
  titleClass?: string;
  desc?: string;
  descClass?: string;
  btnLabel: string;
  btnHref: string;
  btnClass?: string;
  imgSrc: string;
  imgWidth: number;
  imgHeight: number;
  cardClass?: string;
}

export interface MegaMenuCategory {
  /** Category label shown in the sidebar list */
  label: string;
  /** FontAwesome class for the icon */
  icon: string;
  /** Parent href (goes to /shop-by-categories) */
  href: string;
  /** If true, shows the expand arrow and a full mega-panel */
  hasMegaPanel: boolean;
  /** Alignment of the child dropdown panel */
  childWrapperExtra?: string;
  columns?: MegaMenuColumn[];
  banner?: MegaMenuBanner;
}
