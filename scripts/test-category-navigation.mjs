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
    module: loadedModule, exports: loadedModule.exports, URLSearchParams, URL, TextEncoder, process: { env: {} },
    require(name) {
      if (name in overrides) return overrides[name];
      if (name.startsWith('@/')) return load(`${name.slice(2)}.ts`, overrides);
      return require(name);
    },
  });
  return loadedModule.exports;
}
const plain = (value) => JSON.parse(JSON.stringify(value));

test('category links preserve punctuation, commas and Unicode as one query value', () => {
  const { categoryShopHref } = load('lib/storefront-categories.ts');
  const name = 'Pets, Care & Café + Gifts';
  const url = new URL(categoryShopHref(` ${name} `), 'https://store.test');
  assert.equal(url.pathname, '/shop');
  assert.deepEqual(url.searchParams.getAll('category'), [name]);
  assert.equal(url.searchParams.size, 1);
});

test('published categories link to their clean canonical slug when one is available', () => {
  const { categoryShopHref } = load('lib/storefront-categories.ts');
  assert.equal(categoryShopHref('Pets & Care', 'pet-care'), '/category/pet-care');
  assert.equal(categoryShopHref('Pets', 'care & gifts'), '/category/care%20%26%20gifts');
  assert.equal(categoryShopHref('Pets', '   '), '/shop?category=Pets');
});

test('products API forwards repeated category values without splitting category names', async () => {
  let received;
  const { GET } = load('app/api/products/route.ts', {
    '@/lib/backend/storefront-data': { listStorefrontProducts: async (query) => { received = query; return []; } },
    '@/lib/backend/http': { json: (value) => value, handleApiError: (error) => { throw error; } },
  });
  const url = new URL('https://store.test/api/products');
  for (const category of [' Pets, Care & Gifts ', 'Costume', 'Costume', ' ']) url.searchParams.append('category', category);
  url.searchParams.set('q', 'cozy');
  url.searchParams.set('limit', '48');
  url.searchParams.set('offset', '96');
  const result = await GET({ nextUrl: url });
  assert.deepEqual(plain(received), { catalogIds: [], productIds: [], categories: ['Pets, Care & Gifts', 'Costume'], limit: 48, offset: 96, search: 'cozy' });
  assert.deepEqual(plain(result), { data: [] });
});

test('catalog query applies bound category names before the limit and keeps the search', async () => {
  let query;
  const { listStorefrontProducts } = load('lib/backend/storefront-data.ts', {
    '@/lib/productSeoFields': load('lib/productSeoFields.ts'),
    '@/lib/backend/db': { dbQuery: async (sql, params) => { query = { sql, params }; return { rows: [] }; } },
  });
  const unusualName = "Pets'); DROP TABLE products; --";
  await listStorefrontProducts({ categories: [' Costume ', 'COSTUME', unusualName], search: 'cozy', limit: 12 });
  assert.deepEqual(plain(query.params), ['%cozy%', ['costume', unusualName.toLowerCase()], 12, 0]);
  assert.ok(!query.sql.includes(unusualName), 'category names must remain bound values');
  assert.match(query.sql, /WHERE[\s\S]*p\.status IN \('published', 'low stock'\)[\s\S]*c\.status = 'published'[\s\S]*lower\(btrim\(c\.name\)\) = ANY\(\$2::text\[\]\)[\s\S]*LIMIT \$3/);
  await listStorefrontProducts({ categories: [' '], limit: NaN });
  assert.deepEqual(plain(query.params), [24, 0]);
  assert.ok(!query.sql.includes('ANY('));
});

test('product requests retain category scope and category changes invalidate joined product data', () => {
  let request;
  const { useLiveProducts } = load('hooks/use-live-products.ts', {
    react: { useEffect() {} },
    './use-live-resource': { useLiveResource: (options) => { request = options; return { data: [] }; } },
    '@/lib/productNavigation': { primeProductNavigationCache() {} },
  });
  useLiveProducts({ categories: [' Pets, Care ', 'Costume'], search: 'cozy', limit: 48 });
  const url = new URL(request.endpoint, 'https://store.test');
  assert.deepEqual(url.searchParams.getAll('category'), ['Pets, Care', 'Costume']);
  assert.equal(url.searchParams.get('q'), 'cozy');
  assert.equal(url.searchParams.get('limit'), '48');
  assert.ok(request.topics.includes('categories'));
  useLiveProducts({ enabled: false, categories: ['Costume'] });
  assert.equal(request.endpoint, null);
});

test('category feed refreshes for both category edits and product count changes', () => {
  let request;
  const { useLiveCategories } = load('hooks/use-live-categories.ts', {
    './use-live-resource': { useLiveResource: (options) => { request = options; return { data: [] }; } },
  });
  useLiveCategories();
  assert.equal(request.endpoint, '/api/categories');
  assert.ok(request.topics.includes('categories'));
  assert.ok(request.topics.includes('products'));
});

test('a category selected through a differently cased URL can be unchecked', () => {
  const { toggleCategory } = load('components/reducer/filterActions.ts');
  let action;
  toggleCategory('Costume', (value) => { action = value; }, [' COSTUME ', 'Care']);
  assert.deepEqual(plain(action), { type: 'SET_CATEGORIES', payload: ['Care'] });
});

// This page is now a live category directory, so the old demo redirect must not run.
test('View All Categories reaches the directory while retired demo routes still redirect', async () => {
  const { proxy } = load('proxy.ts', {
    jose: {},
    // Custom-domain routing has its own coverage (test-seo.mjs); no store domains here.
    '@/lib/backend/store-domains': { resolveStoreDomain: async () => null },
    'next/server': { NextResponse: {
      next: () => ({ kind: 'next', headers: new Headers() }),
      redirect: (url, status) => ({ kind: 'redirect', url: url.toString(), status, headers: new Headers() }),
    } },
  });
  const request = (path) => {
    const url = new URL(path, 'https://store.test');
    url.clone = () => new URL(url);
    return { headers: new Headers(), nextUrl: url };
  };
  assert.equal((await proxy(request('/categories-list'))).kind, 'next');
  assert.equal((await proxy(request('/categories-list/'))).kind, 'next');
  const retired = await proxy(request('/categories-style-one'));
  assert.equal(retired.kind, 'redirect');
  assert.equal(retired.url, 'https://store.test/');
});
