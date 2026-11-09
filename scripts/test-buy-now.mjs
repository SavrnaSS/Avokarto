// Exercises the real cart store and purchase hook without a database or orders.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import ts from "typescript";

const require = createRequire(import.meta.url);
const PRODUCT = {
  id: "product-one", title: "Test product", price: 59, imgSrc: "/product.webp",
  slug: "test-product", catalogId: "product-one", inStock: true, availableQuantity: 8,
};

function harness({ saved, blockedStorage = false, blockedWrites = false } = {}) {
  const storage = new Map(saved ? [["avokarto-store", saved]] : []);
  const window = {
    localStorage: {
      getItem(key) {
        if (blockedStorage) throw new Error("Storage blocked");
        return storage.get(key) ?? null;
      },
      setItem(key, value) {
        if (blockedStorage || blockedWrites) throw new Error("Storage full or blocked");
        storage.set(key, value);
      },
      removeItem(key) {
        if (blockedStorage) throw new Error("Storage blocked");
        storage.delete(key);
      },
    },
  };
  const loaded = new Map();
  function load(filename, overrides = {}) {
    if (loaded.has(filename)) return loaded.get(filename);
    const loadedModule = { exports: {} };
    const source = readFileSync(new URL(`../${filename}`, import.meta.url), "utf8");
    const { outputText } = ts.transpileModule(source, {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    });
    runInNewContext(outputText, {
      module: loadedModule, exports: loadedModule.exports, window,
      require(name) {
        if (name in overrides) return overrides[name];
        if (name.startsWith("@/")) return load(`${name.slice(2)}.ts`);
        return require(name);
      },
    });
    loaded.set(filename, loadedModule.exports);
    return loadedModule.exports;
  }
  const { useStore } = load("context/store.ts");
  const navigations = [];
  const { useCartQuantityAction } = load("hooks/useCartQuantityAction.ts", {
    react: { useTransition: () => [false, (callback) => callback()] },
    "next/navigation": {
      usePathname: () => "/product/test-product",
      useRouter: () => ({
        push(path) {
          const state = useStore.getState();
          navigations.push({ path, total: state.totalPrice, count: state.cartProducts.length,
            saved: storage.get("avokarto-store") });
        },
      }),
    },
    "@/context/Context": {
      useStore,
      useContextElement: () => ({ ...useStore.getState(), mounted: useStore.persist.hasHydrated() }),
    },
    "@/lib/i18n/translations": { useTranslation: () => ({ t: (text) => text }) },
  });
  return { store: useStore, storage, navigations, useAction: useCartQuantityAction };
}

test("Buy Now commits the chosen item, quantity and price before checkout navigation", () => {
  const h = harness();
  h.useAction(PRODUCT).setQuantity(3);
  assert.equal(h.useAction(PRODUCT).buyNow(), true);
  const line = h.store.getState().cartProducts[0];
  assert.equal(line.id, PRODUCT.id);
  assert.equal(line.quantity, 3);
  assert.equal(line.detailsPageUrl, "/product");
  assert.equal(h.navigations[0].path, "/checkout-shipping");
  assert.equal(h.navigations[0].total, 177);
  assert.equal(h.navigations[0].count, 1);
  const saved = JSON.parse(h.navigations[0].saved).state;
  assert.equal(saved.totalPrice, 177);
  assert.equal(saved.cartProducts[0].quantity, 3);
  assert.equal(saved.quantityDrafts, undefined);
});

test("main panel and sticky button share the selected quantity", () => {
  const h = harness();
  h.useAction(PRODUCT).setQuantity(4);
  const sticky = h.useAction(PRODUCT);
  assert.equal(sticky.quantity, 4);
  sticky.buyNow();
  assert.equal(h.store.getState().cartProducts[0].quantity, 4);
  assert.equal(h.store.getState().quantityDrafts[PRODUCT.id], undefined);
});

test("an immediate Buy Now click uses quantity edits before the next React render", () => {
  const h = harness();
  const action = h.useAction(PRODUCT);
  action.setQuantity(2);
  // Deliberately keep the event handler from the previous render.
  action.buyNow();
  assert.equal(h.store.getState().cartProducts[0].quantity, 2);
  assert.equal(h.navigations[0].total, 118);
});

test("Buy Now remains usable for an unchanged cart item and repeated clicks do not duplicate it", () => {
  const h = harness();
  h.store.getState().addProductToCart(PRODUCT, 2);
  const action = h.useAction(PRODUCT);
  assert.equal(action.isDisabled, true, "Add to Cart is already satisfied");
  assert.equal(action.isBuyNowDisabled, false);
  action.buyNow();
  action.buyNow();
  assert.equal(h.store.getState().cartProducts.length, 1);
  assert.equal(h.store.getState().cartProducts[0].quantity, 2);
  assert.equal(h.store.getState().totalPrice, 118);
});

test("existing items keep their place and bundle membership while stale price and quantity update", () => {
  const h = harness();
  h.store.getState().addBundleToCart([PRODUCT, { ...PRODUCT, id: "two", price: 41 }], "bundle-a");
  h.useAction(PRODUCT).setQuantity(3);
  h.useAction({ ...PRODUCT, price: 60, title: "Updated title" }).buyNow();
  const state = h.store.getState();
  assert.equal(state.cartProducts.length, 2);
  assert.equal(state.cartProducts[0].title, "Updated title");
  assert.equal(state.cartProducts[0].price, 60);
  assert.equal(state.cartProducts[0].quantity, 3);
  assert.equal(state.cartProducts[0].bundleId, "bundle-a");
  assert.equal(state.cartProducts[1].quantity, 1);
  assert.equal(state.totalPrice, 198.9);
});

test("quantity is clamped against stock and the checkout limit", () => {
  for (const [quantity, stock, expected] of [[25, 4, 4], [150, 1000, 99], [0, 8, 1], [-5, 8, 1], [NaN, 8, 1], [2.9, 8, 2]]) {
    const h = harness();
    assert.equal(h.store.getState().prepareCheckout({ ...PRODUCT, availableQuantity: stock }, quantity), true);
    assert.equal(h.store.getState().cartProducts[0].quantity, expected);
  }
});

test("unavailable products and invalid prices cannot navigate or change the cart", () => {
  for (const change of [{ inStock: false }, { isStockOut: true }, { availableQuantity: 0 }, { availableQuantity: -1 }, { price: NaN }, { price: Infinity }, { price: -10 }, { id: "" }]) {
    const h = harness();
    h.store.getState().addProductToCart(PRODUCT, 1);
    const before = JSON.stringify(h.store.getState().cartProducts);
    assert.equal(h.useAction({ ...PRODUCT, ...change }).buyNow(), false);
    assert.equal(h.navigations.length, 0);
    assert.equal(JSON.stringify(h.store.getState().cartProducts), before);
  }
});

test("reload restores the selected product and recomputes its total from persisted lines", () => {
  const h = harness();
  h.useAction(PRODUCT).setQuantity(2);
  h.useAction(PRODUCT).buyNow();
  const saved = JSON.parse(h.storage.get("avokarto-store"));
  saved.state.totalPrice = 0;
  const reloaded = harness({ saved: JSON.stringify(saved) });
  assert.equal(reloaded.store.persist.hasHydrated(), true);
  assert.equal(reloaded.store.getState().cartProducts[0].quantity, 2);
  assert.equal(reloaded.store.getState().totalPrice, 118);
});

test("malformed storage, blocked storage and full storage do not break current-tab checkout", () => {
  for (const options of [{ saved: "invalid-json" }, { blockedStorage: true }, { blockedWrites: true }]) {
    const h = harness(options);
    assert.equal(h.store.persist.hasHydrated(), true);
    assert.equal(h.useAction(PRODUCT).buyNow(), true);
    assert.equal(h.navigations[0].total, 59);
    assert.equal(h.store.getState().cartProducts.length, 1);
    assert.doesNotThrow(() => h.store.persist.clearStorage());
  }
});

test("selection for another product cannot change this product's purchase quantity", () => {
  const h = harness();
  h.useAction(PRODUCT).setQuantity(5);
  const other = { ...PRODUCT, id: "another-product" };
  assert.equal(h.useAction(other).quantity, 1);
  h.useAction(other).buyNow();
  assert.equal(h.store.getState().cartProducts[0].quantity, 1);
});
