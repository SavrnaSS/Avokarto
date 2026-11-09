import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';

function load(filename, imports = {}) {
  const loadedModule = { exports: {} };
  const { outputText } = ts.transpileModule(readFileSync(new URL(`../${filename}`, import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  runInNewContext(outputText, {
    module: loadedModule, exports: loadedModule.exports, URL, URLSearchParams,
    require(name) { if (!(name in imports)) throw new Error(`Unexpected dependency ${name}`); return imports[name]; },
  });
  return loadedModule.exports;
}
const plain = value => JSON.parse(JSON.stringify(value));
const catalog = count => Array.from({ length: count }, (_, id) => ({ id: String(id), catalogId: String(id), title: `Product ${id}`, price: 10, category: ['Costume'] }));
const options = (extras = {}) => ({ signal: new AbortController().signal, deduplicate: true, ...extras });
const endpoint = pages => `/api/products?category=Pets%2C+Care%26Gifts&q=cozy&pages=${pages}`;
function harness(count = 137) {
  let products = catalog(count);
  const calls = [];
  let intercept;
  const { createProductWindowReader } = load('lib/product-pages.ts', {
    '@/lib/resource-request': { async requestResource(url, opts) {
      const query = new URL(url, 'http://localhost').searchParams;
      const offset = Number(query.get('offset'));
      const limit = Number(query.get('limit'));
      calls.push({ offset, limit, categories: query.getAll('category'), search: query.get('q'), scope: opts.refreshScope });
      if (intercept) {
        const result = intercept(offset, limit, opts);
        if (result !== undefined) return result;
      }
      return products.slice(offset, offset + limit);
    } },
  });
  return { read: createProductWindowReader(), calls, replace: value => { products = value; }, intercept: fn => { intercept = fn; } };
}

test('a 137-product category loads every product with bounded requests beyond the old 100-product cutoff', async () => {
  const h = harness();
  let window;
  for (let pages = 1; pages <= 6; pages++) {
    window = await h.read(endpoint(pages), options());
    assert.equal(window.products.length, Math.min(pages * 24, 137));
    assert.equal(window.hasMore, pages < 6);
  }
  assert.deepEqual(plain(window.products.map(p => p.id)), catalog(137).map(p => p.id));
  assert.deepEqual(h.calls.map(c => c.offset), [0, 24, 48, 72, 96, 120]);
  assert.ok(h.calls.every(c => c.limit === 25 && c.search === 'cozy' && c.categories[0] === 'Pets, Care&Gifts'));
  await h.read(endpoint(7), options());
  assert.equal(h.calls.length, 6, 'no further read beyond the known end');
});

test('empty categories and exact page-size multiples stop without an unnecessary request', async () => {
  const empty = await harness(0).read(endpoint(1), options());
  assert.equal(empty.products.length, 0);
  assert.equal(empty.hasMore, false);
  const h = harness(48);
  assert.equal((await h.read(endpoint(1), options())).hasMore, true);
  const last = await h.read(endpoint(2), options());
  assert.equal(last.products.length, 48);
  assert.equal(last.hasMore, false);
  assert.equal(h.calls.length, 2);
});

test('realtime events and explicit retries refresh every loaded page including moved, deleted and repriced products', async () => {
  const h = harness(90);
  await h.read(endpoint(3), options());
  const updated = catalog(90).filter(p => p.id !== '4').map(p => ({ ...p, price: Number(p.id) >= 48 ? 99 : 10 }));
  updated.unshift(updated.splice(75, 1)[0]);
  h.replace(updated);
  h.calls.length = 0;
  const scope = {};
  const refreshed = await h.read(endpoint(3), options({ refreshScope: scope }));
  assert.deepEqual(plain(refreshed.products), updated.slice(0, 72));
  assert.deepEqual(h.calls.map(c => c.offset), [0, 24, 48]);
  assert.ok(h.calls.every(c => c.scope === scope));
  h.replace(updated.slice(0, 27));
  h.calls.length = 0;
  const shortened = await h.read(endpoint(3), options({ deduplicate: false }));
  assert.equal(shortened.products.length, 27);
  assert.equal(shortened.hasMore, false);
  assert.deepEqual(h.calls.map(c => c.offset), [0, 24]);
});

test('failed later pages preserve the previous result and force a fresh full read on retry', async () => {
  const h = harness();
  const previous = await h.read(endpoint(2), options());
  h.intercept(offset => { if (offset === 48) throw new Error('Temporary failure'); });
  await assert.rejects(h.read(endpoint(3), options()), /Temporary failure/);
  assert.equal(previous.products.length, 48);
  h.intercept(undefined);
  h.calls.length = 0;
  const recovered = await h.read(endpoint(3), options());
  assert.equal(recovered.products.length, 72);
  assert.deepEqual(h.calls.map(c => c.offset), [0, 24, 48]);
});

test('an aborted load-more response cannot overwrite a newer realtime refresh', async () => {
  const h = harness();
  await h.read(endpoint(1), options());
  let finishOld;
  h.intercept(offset => {
    if (offset === 24) {
      h.intercept(undefined);
      return new Promise(resolve => { finishOld = resolve; });
    }
  });
  const controller = new AbortController();
  const old = h.read(endpoint(2), options({ signal: controller.signal }));
  const rejected = assert.rejects(old, { name: 'AbortError' });
  controller.abort();
  const updated = catalog(137).map(p => ({ ...p, price: 79 }));
  h.replace(updated);
  await h.read(endpoint(2), options({ refreshScope: {} }));
  finishOld(catalog(137).slice(24, 49));
  await rejected;
  h.calls.length = 0;
  const latest = await h.read(endpoint(3), options());
  assert.ok(latest.products.every(p => p.price === 79));
  assert.deepEqual(h.calls.map(c => c.offset), [48]);
});

test('switching filters never appends products from the previous category', async () => {
  const h = harness();
  await h.read(endpoint(2), options());
  h.replace(catalog(4).map(p => ({ ...p, category: ['Care'] })));
  h.calls.length = 0;
  const result = await h.read('/api/products?category=Care&pages=1', options());
  assert.equal(result.products.length, 4);
  assert.ok(result.products.every(p => p.category[0] === 'Care'));
  assert.deepEqual(h.calls.map(c => c.offset), [0]);
});

test('backend pagination uses a bounded limit, safe offset and deterministic order', async () => {
  let query;
  const { listStorefrontProducts } = load('lib/backend/storefront-data.ts', {
    '@/lib/productSeoFields': load('lib/productSeoFields.ts'),
    '@/lib/backend/db': { dbQuery: async (sql, params) => { query = { sql, params }; return { rows: [] }; } },
  });
  await listStorefrontProducts({ limit: 25, offset: 120, categories: ['Costume'] });
  assert.deepEqual(plain(query.params), [['costume'], 25, 120]);
  assert.match(query.sql, /p\.updated_at DESC, p\.name ASC, p\.id ASC\s+LIMIT \$2 OFFSET \$3/);
  for (const offset of [-1, 1.5, Infinity, NaN, Number.MAX_SAFE_INTEGER + 1]) {
    await listStorefrontProducts({ offset, limit: 200 });
    assert.deepEqual(plain(query.params), [100, 0]);
  }
});

test('appended and refreshed products preserve the visible page while changed filters reset it', () => {
  const { reducer, initialState } = load('components/reducer/filterReducer.ts');
  const state = { ...initialState, currentPage: 7, itemPerPage: 15 };
  const refreshed = reducer(state, { type: 'FILTER_PRODUCTS', payload: catalog(137), preservePage: true });
  assert.equal(reducer(refreshed, { type: 'SORT_PRODUCTS', preservePage: true }).currentPage, 7);
  const smaller = reducer(refreshed, { type: 'FILTER_PRODUCTS', payload: catalog(30), preservePage: true });
  assert.equal(smaller.currentPage, 2);
  assert.equal(reducer(refreshed, { type: 'FILTER_PRODUCTS', payload: catalog(137) }).currentPage, 1);
  assert.equal(reducer(refreshed, { type: 'SORT_PRODUCTS' }).currentPage, 1);
});
