import type { CartProduct, Product } from "@/types";
import { isProductOutOfStock } from "@/lib/cartQuantity";
import { requestResource, type ResourceRequestOptions } from "@/lib/resource-request";

export type ListingPrice = {
  listingId: string;
  price: number | null;
  storeHandle?: string;
  storeName?: string;
};

/** Live catalog data for the cart: products, plus store prices for reseller lines. */
export type CartCatalog = {
  listingPrices: ListingPrice[];
  products: Product[];
};

export const EMPTY_CART_CATALOG: CartCatalog = { listingPrices: [], products: [] };

export function cartCatalogKey(products: readonly CartProduct[]) {
  return JSON.stringify({
    ids: [...new Set(products.map((product) => String(product.id)))].sort(),
    listings: [...new Set(products.flatMap((product) => product.resellerListingId ? [product.resellerListingId] : []))].sort(),
  });
}

export function cartCatalogQuery(key: string) {
  const { ids, listings } = JSON.parse(key) as { ids: string[]; listings: string[] };
  const query = new URLSearchParams();
  for (const id of ids) query.append("productId", id);
  for (const id of listings) query.append("listingId", id);
  return query;
}

// A saved cart can contain either legacy numeric IDs or catalog UUIDs.
// Read every requested item without depending on catalog sorting/pagination.
export async function readCartCatalog(endpoint: string, options: ResourceRequestOptions): Promise<CartCatalog> {
  const params = new URLSearchParams(endpoint.split("?")[1]);
  const ids = params.getAll("productId");
  const listingIds = params.getAll("listingId");
  const requests: Promise<Product[]>[] = [];
  for (let index = 0; index < ids.length; index += 24) {
    const chunk = ids.slice(index, index + 24);
    const query = new URLSearchParams({ limit: String(chunk.length) });
    for (const id of chunk) query.append("productId", id);
    requests.push(requestResource<Product[]>(`/api/products?${query}`, options));
  }
  const listingQuery = new URLSearchParams();
  for (const id of listingIds) listingQuery.append("id", id);
  const [products, listingPrices] = await Promise.all([
    Promise.all(requests).then((chunks) => chunks.flat()),
    listingIds.length
      ? requestResource<ListingPrice[]>(`/api/stores/listing-prices?${listingQuery}`, options)
      : Promise.resolve([]),
  ]);
  return { listingPrices, products };
}

export function reconcileCartCatalog(cart: CartProduct[], catalog: CartCatalog) {
  const byId = new Map<string, Product>();
  for (const product of catalog.products) {
    byId.set(String(product.id), product);
    if (product.catalogId) byId.set(product.catalogId, product);
  }
  const listingPrices = new Map(catalog.listingPrices.map((listing) => [listing.listingId, listing]));
  let changed = false;
  const next = cart.map((line) => {
    const product = byId.get(String(line.id));
    let updated: CartProduct = product
      ? { ...line, ...product, isStockOut: isProductOutOfStock(product), id: line.id, quantity: line.quantity, bundleId: line.bundleId }
      : { ...line, inStock: false, availableQuantity: 0 };

    if (line.resellerListingId) {
      const listing = listingPrices.get(line.resellerListingId);
      if (listing?.price != null) {
        // Still sold by the store: keep the store's current price.
        updated = {
          ...updated,
          price: listing.price,
          resellerListingId: line.resellerListingId,
          resellerStore: listing.storeHandle && listing.storeName
            ? { handle: listing.storeHandle, name: listing.storeName }
            : line.resellerStore,
        };
      } else if (listing) {
        // The store stopped selling it (or was suspended): regular Avokarto price.
        const { resellerListingId: _listing, resellerStore: _store, ...regular } = updated;
        void _listing;
        void _store;
        updated = regular;
      } else {
        // Store prices not loaded yet - keep what the shopper saw.
        updated = { ...updated, price: line.price };
      }
    }

    if (JSON.stringify(updated) === JSON.stringify(line)) return line;
    changed = true;
    return updated;
  });
  return changed ? next : cart;
}

export function cartAvailabilityIssues(cart: readonly CartProduct[]) {
  return cart.flatMap((line) => {
    if (isProductOutOfStock(line)) return [`${line.title} is no longer available. Remove it from your cart to continue.`];
    if (Number.isFinite(line.availableQuantity) && line.quantity > line.availableQuantity!) {
      return [`Only ${line.availableQuantity} of ${line.title} are available. Update the quantity in your cart.`];
    }
    return [];
  });
}
