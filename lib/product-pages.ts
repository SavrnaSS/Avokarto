import type { Product } from "@/types/product";
import { requestResource, type ResourceRequestOptions } from "@/lib/resource-request";

export const PRODUCT_PAGE_SIZE = 24;

export type ProductWindow = {
  products: Product[];
  hasMore: boolean;
  pageCount: number;
};

// Each shop owns its loaded pages. Ordinary "load more" reads only the next
// page; a realtime event or explicit retry rereads the entire visible window
// so deletions, reordered products and price/stock changes replace stale rows.
export function createProductWindowReader() {
  let previous: { key: string; window: ProductWindow } | undefined;
  let sequence = 0;

  return async (endpoint: string, options: ResourceRequestOptions): Promise<ProductWindow> => {
    const requestId = ++sequence;
    const url = new URL(endpoint, "http://localhost");
    const requestedPages = Number(url.searchParams.get("pages"));
    const pageCount = Number.isSafeInteger(requestedPages) && requestedPages > 0 ? requestedPages : 1;
    url.searchParams.delete("pages");
    const key = `${url.pathname}?${url.searchParams}`;
    const cached = previous?.key === key ? previous.window : undefined;
    const window: ProductWindow = cached && cached.pageCount < pageCount && options.deduplicate && !options.refreshScope
      ? { ...cached, products: [...cached.products] }
      : { products: [], hasMore: true, pageCount: 0 };

    try {
      for (let page = window.pageCount; page < pageCount && window.hasMore; page++) {
        url.searchParams.set("offset", String(page * PRODUCT_PAGE_SIZE));
        // One lookahead row tells us whether another page exists, including
        // catalogs whose size is an exact multiple of the page size.
        url.searchParams.set("limit", String(PRODUCT_PAGE_SIZE + 1));
        const rows = await requestResource<Product[]>(`${url.pathname}?${url.searchParams}`, options);
        options.signal.throwIfAborted();
        if (!Array.isArray(rows)) throw new Error("Unable to read the product page.");
        window.products.push(...rows.slice(0, PRODUCT_PAGE_SIZE));
        window.hasMore = rows.length > PRODUCT_PAGE_SIZE;
        window.pageCount = page + 1;
      }
      // An intervening catalog write can move a product across page boundaries.
      window.products = [...new Map(window.products.map((product) => [product.catalogId ?? product.id, product])).values()];
      options.signal.throwIfAborted();
      if (requestId === sequence) previous = { key, window };
      return window;
    } catch (error) {
      // A failed refresh must not supply cached pages to the next load-more.
      if (requestId === sequence) previous = undefined;
      throw error;
    }
  };
}
