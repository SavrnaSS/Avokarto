export type IsotopeInstance = {
  arrange: (opts: {
    filter: string | ((elem: HTMLElement) => boolean);
  }) => void;
  layout: () => void;
  destroy: () => void;
  reloadItems?: () => void;
  getItemElements: () => Element[];
};

export type IsotopeOptions = {
  itemSelector: string;
  layoutMode: string;
  percentPosition?: boolean;
};
