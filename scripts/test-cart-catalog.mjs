import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';

const require = createRequire(import.meta.url);
function load(filename, overrides = {}) {
  const loadedModule = { exports: {} };
  const { outputText } = ts.transpileModule(readFileSync(new URL(`../${filename}`, import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  runInNewContext(outputText, {
    module: loadedModule, exports: loadedModule.exports, URLSearchParams,
    require(name) {
      if (name in overrides) return overrides[name];
      if (name.startsWith('@/')) return load(`${name.slice(2)}.ts`, overrides);
      return require(name);
    },
  });
  return loadedModule.exports;
}
const cart = load('lib/cartCatalog.ts', { '@/lib/resource-request': {} });
const totals = load('lib/cartQuantity.ts');
const item = { id: 12, title: 'Saved product', price: 49, quantity: 2, imgSrc: '/saved.webp', bundleId: 'bundle' };
const catalog = (products, listingPrices = []) => ({ products, listingPrices });
const live = { id: 12, catalogId: 'catalog-uuid', title: 'Live product', price: 55, availableQuantity: 8, inStock: true, imgSrc: '/live.webp' };

test('live catalog updates price, stock and metadata without losing quantity or bundle membership', () => {
  const next = cart.reconcileCartCatalog([item], catalog([live]));
  assert.equal(next[0].price, 55);
  assert.equal(next[0].title, 'Live product');
  assert.equal(next[0].quantity, 2);
  assert.equal(next[0].bundleId, 'bundle');
  assert.equal(totals.getCartTotalPrice(next), 110);
  assert.equal(cart.reconcileCartCatalog(next, catalog([live])), next, 'unchanged reads must not cause update loops');
});

test('missing products remain removable and returning inventory clears stale out-of-stock flags', () => {
  const missing = cart.reconcileCartCatalog([item], catalog([]));
  assert.equal(missing.length, 1);
  assert.match(cart.cartAvailabilityIssues(missing)[0], /no longer available/);
  const restored = cart.reconcileCartCatalog([{ ...missing[0], isStockOut: true }], catalog([live]));
  assert.equal(cart.cartAvailabilityIssues(restored).length, 0);
});

test('stock shortages preserve the chosen quantity and require review', () => {
  const next = cart.reconcileCartCatalog([item], catalog([{ ...live, availableQuantity: 1 }]));
  assert.equal(next[0].quantity, 2);
  assert.match(cart.cartAvailabilityIssues(next)[0], /Only 1 of Live product/);
});

test('catalog UUIDs and legacy numeric IDs resolve the same product without changing the cart key', () => {
  const uuidCart = [{ ...item, id: live.catalogId }];
  const key = cart.cartCatalogKey(uuidCart);
  const updated = cart.reconcileCartCatalog(uuidCart, catalog([live]));
  assert.equal(updated[0].price, 55);
  assert.equal(cart.cartCatalogKey(updated), key);
  assert.equal(cart.cartCatalogKey([item, { ...item, id: 13 }]), cart.cartCatalogKey([{ ...item, id: 13 }, item]));
});

test('large saved carts read every requested ID in bounded batches and propagate cancellation', async () => {
  const requests = [];
  const reader = load('lib/cartCatalog.ts', { '@/lib/resource-request': { requestResource: async (endpoint, options) => {
    requests.push({ endpoint, options });
    return new URL(endpoint, 'https://store.test').searchParams.getAll('productId').map((id) => ({ id }));
  } } });
  const query = new URLSearchParams();
  for (let i = 1; i <= 53; i++) query.append('productId', String(i));
  const signal = new AbortController().signal;
  const result = await reader.readCartCatalog(`/api/products?${query}`, { signal });
  assert.equal(result.products.length, 53);
  assert.equal(result.listingPrices.length, 0, 'no store lines, no store-price request');
  assert.deepEqual(requests.map(({ endpoint }) => Number(new URL(endpoint, 'https://store.test').searchParams.get('limit'))), [24, 24, 5]);
  assert.ok(requests.every(({ options }) => options.signal === signal));
});

test('store-priced lines keep the store price, fall back to the regular price when the store stops selling, and wait while unloaded', () => {
  const resold = { ...item, price: 58.8, resellerListingId: 'listing-1', resellerStore: { handle: 'riya', name: "Riya's Picks" } };
  const kept = cart.reconcileCartCatalog([resold], catalog([live], [{ listingId: 'listing-1', price: 66, storeHandle: 'riya', storeName: "Riya's Picks" }]));
  assert.equal(kept[0].price, 66, 'store repriced');
  assert.equal(kept[0].resellerListingId, 'listing-1');
  assert.equal(kept[0].title, 'Live product', 'catalog metadata still refreshes');

  const dropped = cart.reconcileCartCatalog([resold], catalog([live], [{ listingId: 'listing-1', price: null }]));
  assert.equal(dropped[0].price, 55, 'regular Avokarto price');
  assert.equal(dropped[0].resellerListingId, undefined);
  assert.equal(dropped[0].resellerStore, undefined);

  const pending = cart.reconcileCartCatalog([resold], catalog([live]));
  assert.equal(pending[0].price, 58.8, 'never shows the base price before store prices load');
  assert.notEqual(cart.cartCatalogKey([resold]), cart.cartCatalogKey([item]), 'store lines refetch store prices');
});

test('store prices are read alongside products for reseller lines', async () => {
  const endpoints = [];
  const reader = load('lib/cartCatalog.ts', { '@/lib/resource-request': { requestResource: async (endpoint) => {
    endpoints.push(endpoint);
    return endpoint.startsWith('/api/stores/') ? [{ listingId: 'listing-1', price: 66 }] : [{ id: 12 }];
  } } });
  const result = await reader.readCartCatalog(`/api/products?${reader.cartCatalogQuery(reader.cartCatalogKey([{ ...item, resellerListingId: 'listing-1' }]))}`, { signal: new AbortController().signal });
  assert.equal(result.products.length, 1);
  assert.equal(result.listingPrices[0].price, 66);
  assert.ok(endpoints.some((endpoint) => endpoint === '/api/stores/listing-prices?id=listing-1'));
});

test('product ID filtering uses bound identifiers before pagination for legacy and UUID carts', async () => {
  let query;
  const { listStorefrontProducts } = load('lib/backend/storefront-data.ts', {
    '@/lib/productSeoFields': load('lib/productSeoFields.ts'), '@/lib/backend/db': { dbQuery: async (sql, params) => {
    query = { sql, params }; return { rows: [] };
  } } });
  const ids = ['12', 'catalog-uuid', "unknown'); DROP TABLE products; --"];
  await listStorefrontProducts({ productIds: ids, limit: 3 });
  assert.deepEqual(JSON.parse(JSON.stringify(query.params)), [ids, 3, 0]);
  assert.match(query.sql, /p\.id::text = ANY\(\$1::text\[\]\) OR p\.legacy_id::text = ANY\(\$1::text\[\]\)/);
  assert.ok(!query.sql.includes(ids[2]));
});

test('products API rejects invalid or oversized product ID filters instead of returning an unfiltered catalog', async () => {
  let reads = 0;
  const { GET } = load('app/api/products/route.ts', {
    '@/lib/backend/storefront-data': { listStorefrontProducts: async () => { reads++; return []; } },
    '@/lib/backend/http': { json: (value) => value, handleApiError: (error) => { throw error; } },
  });
  for (const ids of [[''], Array.from({ length: 25 }, (_, i) => String(i))]) {
    const nextUrl = new URL('https://store.test/api/products');
    for (const id of ids) nextUrl.searchParams.append('productId', id);
    await assert.rejects(GET({ nextUrl }));
  }
  assert.equal(reads, 0);
});
