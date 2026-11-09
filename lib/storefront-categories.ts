export type StorefrontCategory = {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  status: string;
  count: number;
  sortOrder: number;
};

export function normalizeCategoryNames(names: readonly string[] = []) {
  return [...new Set(names.map((name) => name.trim()).filter(Boolean))];
}

export function categoryShopHref(name: string, slug?: string | null) {
  if (slug?.trim()) return `/category/${encodeURIComponent(slug.trim())}`;
  return `/shop?category=${encodeURIComponent(name.trim())}`;
}
