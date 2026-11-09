export type PortfolioCardItem = {
  title: string;
  subtitle: string;
  img: string;
};

export type IsotopFilter = {
  label: string;
  filter: string;
  isActive?: boolean;
};

export type IsotopPortfolioItem = {
  title: string;
  subtitle: string;
  img: string;
  filterClassName?: string;
};

export interface Portfolio {
  id?: number;
  title: string;
  category?: string;

  img?: string;
  description?: string;
  subtitle?: string;
}
