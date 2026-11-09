// All checkout queries below are simulated. This suite never connects to a
// database, places an order, adjusts inventory, or sends a confirmation email.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import ts from "typescript";
import { z } from "zod";

function loadTypeScript(filename, imports = {}) {
  const loadedModule = { exports: {} };
  const source = readFileSync(new URL(`../${filename}`, import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  runInNewContext(outputText, {
    module: loadedModule,
    exports: loadedModule.exports,
    require(name) {
      if (!(name in imports)) throw new Error(`Unexpected dependency: ${name}`);
      return imports[name];
    },
  });
  return loadedModule.exports;
}

const storePolicy = loadTypeScript("lib/storePolicy.ts");
const policy = loadTypeScript("lib/shippingPolicy.ts", { "./storePolicy": storePolicy });
const bundles = loadTypeScript("lib/bundleDiscount.ts");
const { getCartSummary, FREE_SHIPPING_THRESHOLD } = loadTypeScript("lib/cartSummaryUtils.ts", {
  "./shippingPolicy": policy,
  "./storePolicy": storePolicy,
});

for (const [subtotal, expectedCost, remaining] of [
  [0, 24.95, 100],
  [99.99, 24.95, 0.01],
  [100, 0, 0],
  [100.01, 0, 0],
  [250, 0, 0],
]) {
  test(`USD ${subtotal.toFixed(2)} receives shipping cost ${expectedCost}`, () => {
    assert.equal(policy.FREE_SHIPPING_THRESHOLD_USD, 100);
    assert.equal(policy.getShippingCost(subtotal, 24.95), expectedCost);
    assert.equal(policy.qualifiesForFreeShipping(subtotal), subtotal >= 100);
    assert.equal(policy.getFreeShippingRemaining(subtotal), remaining);
  });
}

test("threshold uses currency precision and rejects non-finite qualifying values", () => {
  assert.equal(policy.getShippingCost(99.99999999999999, 12), 0);
  for (const total of [Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY, -10]) {
    assert.equal(policy.qualifiesForFreeShipping(total), false);
    assert.equal(policy.getFreeShippingRemaining(total), 100);
  }
  assert.equal(policy.getShippingCost(40, 0), 0, "an already-free method remains free");
});

test("cart summary leaves shipping pending below the threshold without a selected rate", () => {
  const summary = getCartSummary(99.99, 1);
  assert.equal(FREE_SHIPPING_THRESHOLD, 100);
  assert.equal(summary.shippingPending, true);
  assert.equal(summary.shippingTotal, 0);
  assert.equal(summary.orderTotal, 99.99);
  assert.equal(summary.hasFreeShipping, false);
  assert.equal(summary.amountToFreeShipping, 0.01);
  assert.ok(summary.progressPercent < 100);
});

test("cart summary applies selected rates below the threshold and waives them at or above it", () => {
  const below = getCartSummary(99.99, 1, 24.95);
  assert.equal(below.shippingPending, false);
  assert.equal(below.shippingTotal, 24.95);
  assert.equal(below.orderTotal, 124.94);
  for (const subtotal of [100, 100.01]) {
    for (const selectedRate of [undefined, 0, 24.95]) {
      const summary = getCartSummary(subtotal, 1, selectedRate);
      assert.equal(summary.shippingPending, false);
      assert.equal(summary.shippingTotal, 0);
      assert.equal(summary.orderTotal, subtotal);
      assert.equal(summary.hasFreeShipping, true);
      assert.equal(summary.amountToFreeShipping, 0);
      assert.equal(summary.progressPercent, 100);
    }
  }
});

test("an empty cart never advertises unlocked shipping or adds a selected delivery fee", () => {
  const summary = getCartSummary(0, 0, 24.95);
  assert.equal(summary.hasItems, false);
  assert.equal(summary.hasFreeShipping, false);
  assert.equal(summary.shippingPending, false);
  assert.equal(summary.shippingTotal, 0);
  assert.equal(summary.orderTotal, 0);
  assert.equal(summary.amountToFreeShipping, 100);
  assert.equal(summary.progressPercent, 0);
});

test("cart summary reevaluates qualification after bundle discounts", () => {
  const discounted = bundles.priceWithBundles([
    { key: "one", bundleId: "bundle-a", unitPrice: 55, quantity: 1 },
    { key: "two", bundleId: "bundle-a", unitPrice: 55, quantity: 1 },
  ]);
  const summary = getCartSummary(discounted.total, 2, 24.95);
  assert.equal(discounted.subtotal, 110);
  assert.equal(discounted.total, 99);
  assert.equal(summary.hasFreeShipping, false);
  assert.equal(summary.amountToFreeShipping, 1);
  assert.equal(summary.shippingTotal, 24.95);
  assert.equal(summary.orderTotal, 123.95);
});

function product(id, price, stock = 10) {
  return { id, price, stock, image_url: "/product.webp", legacy_id: null, name: `Product ${id}`, sku: id };
}

const EXPRESS = { id: "express", name: "Express", price: "24.95", min_delivery_days: 1, max_delivery_days: 2, status: "active" };

// The admin's settings as checkout reads them (lib/backend/store-policy.ts),
// with the real payment-method rule.
function storePolicyModule(settings) {
  return {
    getStoreSettingsPolicy: async () => ({ ...settings, adminSessionDays: 7 }),
    assertPaymentMethodAllowed(submitted, active) {
      const key = storePolicy.paymentMethodKeyOf(submitted);
      if (key && !active.paymentMethods.includes(key)) {
        throw Object.assign(new Error("That payment method isn't available. Please choose another."), { code: "PAYMENT_METHOD_UNAVAILABLE", status: 400 });
      }
    },
  };
}

function checkoutHarness({ products, methods = [EXPRESS], customers = [], listings = [], settings = storePolicy.DEFAULT_STORE_POLICY }) {
  const queries = [];
  const earnings = [];
  class MockHttpError extends Error {
    constructor(status, message, code) {
      super(message);
      this.status = status;
      this.code = code;
    }
  }
  const client = {
    async query(sql, params = []) {
      queries.push({ sql, params });
      if (sql.includes("FROM customers")) {
        return { rows: customers.filter((customer) => customer.id === params[0] && customer.password_hash && customer.status === "active") };
      }
      if (sql.includes("FROM products")) return { rows: products };
      if (sql.includes("FROM shipping_methods")) {
        return { rows: methods.filter((method) => method.id === params[0] && (!sql.includes("status = 'active'") || method.status === "active")) };
      }
      if (sql.includes("INSERT INTO orders")) return { rows: [{ id: "order-test", order_number: params[0] }] };
      if (sql.includes("INSERT INTO order_items")) return { rows: [{ id: `item-${params[1]}` }] };
      if (sql.includes("UPDATE products")) return { rows: [] };
      throw new Error(`Unexpected simulated query: ${sql}`);
    },
  };
  const { createCheckoutOrder } = loadTypeScript("lib/backend/checkout.ts", {
    zod: { z },
    "@/lib/backend/db": { withTransaction: (callback) => callback(client) },
    "@/lib/backend/http": { HttpError: MockHttpError },
    "@/lib/bundleDiscount": bundles,
    "@/lib/shippingPolicy": policy,
    "@/lib/backend/store-policy": storePolicyModule(settings),
    // Reseller listings resolve from the fixture; earnings are captured.
    "@/lib/backend/resellers": {
      resolveCheckoutListings: async (_client, ids) =>
        new Map(listings.filter((listing) => ids.includes(listing.listingId)).map((listing) => [listing.listingId, listing])),
      recordResellerEarning: async (_client, earning) => { earnings.push(earning); },
      // Branding for the order email of a single-store order.
      getOrderEmailStore: async (_client, storeId) => ({ accentColor: "#be185d", contactEmail: "", domain: null, handle: storeId, name: `Store ${storeId}`, theme: "modern", whatsapp: "" }),
    },
  });
  return {
    earnings,
    queries,
    checkout(items, extra = {}, trustedOptions = {}) {
      return createCheckoutOrder({
        customerName: "Test Shopper",
        customerEmail: "shopper@example.test",
        shippingMethodId: EXPRESS.id,
        items,
        ...extra,
      }, trustedOptions);
    },
  };
}

function assertCharges(harness, result, { subtotal, shipping, total }) {
  assert.equal(result.order.subtotal, subtotal);
  assert.equal(result.order.shippingCost, shipping);
  assert.equal(result.order.total, total);
  assert.equal(result.confirmationEmail.shippingCost, shipping);
  assert.equal(result.confirmationEmail.total, total);
  assert.equal(result.confirmationEmail.shippingMethod.name, EXPRESS.name);
  const stored = harness.queries.find(({ sql }) => sql.includes("INSERT INTO orders"));
  assert.equal(stored.params[5], total);
  assert.equal(stored.params[6], "USD");
  assert.equal(stored.params[11], EXPRESS.id);
  assert.equal(stored.params[12], EXPRESS.name);
  assert.equal(stored.params[13], shipping);
}

for (const subtotal of [99.99, 100, 100.01]) {
  test(`authoritative checkout, stored order and email agree at USD ${subtotal}`, async () => {
    const harness = checkoutHarness({ products: [product("one", String(subtotal))] });
    const result = await harness.checkout([{ id: "one", quantity: 1 }]);
    const shipping = subtotal < 100 ? 24.95 : 0;
    assertCharges(harness, result, { subtotal, shipping, total: Number((subtotal + shipping).toFixed(2)) });
  });
}

test("shipping and client supplied totals cannot make a below-threshold order qualify", async () => {
  const harness = checkoutHarness({ products: [product("one", "90")] });
  const result = await harness.checkout([{ id: "one", quantity: 1, price: 100 }], {
    subtotal: 100,
    total: 100,
    shippingCost: 0,
    couponCode: "UNSUPPORTED-CODE",
  });
  assertCharges(harness, result, { subtotal: 90, shipping: 24.95, total: 114.95 });
});

test("a qualifying bundle can move merchandise below the threshold", async () => {
  const harness = checkoutHarness({ products: [product("one", "55"), product("two", "55")] });
  const result = await harness.checkout([
    { id: "one", quantity: 1, bundleId: "bundle-a" },
    { id: "two", quantity: 1, bundleId: "bundle-a" },
  ]);
  assert.equal(result.order.bundleDiscount, 11);
  assert.equal(result.confirmationEmail.itemsSubtotal, 110);
  assertCharges(harness, result, { subtotal: 99, shipping: 24.95, total: 123.95 });
});

test("premium shipping is waived when discounted merchandise still qualifies", async () => {
  const harness = checkoutHarness({ products: [product("one", "60"), product("two", "60")] });
  const result = await harness.checkout([
    { id: "one", quantity: 1, bundleId: "bundle-a" },
    { id: "two", quantity: 1, bundleId: "bundle-a" },
  ]);
  assert.equal(result.order.bundleDiscount, 12);
  assertCharges(harness, result, { subtotal: 108, shipping: 0, total: 108 });
});

test("quantities count toward the threshold and preserve charged line prices", async () => {
  const harness = checkoutHarness({ products: [product("one", "50")] });
  const result = await harness.checkout([{ id: "one", quantity: 2 }]);
  assertCharges(harness, result, { subtotal: 100, shipping: 0, total: 100 });
  assert.equal(result.confirmationEmail.items[0].unitPrice, 50);
  assert.equal(result.confirmationEmail.items[0].quantity, 2);
  assert.equal(result.order.items[0].unitPrice, 50);
  assert.equal(result.order.items[0].quantity, 2);
});

test("changed merchandise prices require review before order or inventory writes", async () => {
  const harness = checkoutHarness({ products: [product("one", "55")] });
  await assert.rejects(harness.checkout([{ id: "one", quantity: 2, expectedUnitPrice: 50 }]), { code: "CHECKOUT_PRICE_CHANGED", status: 409 });
  assert.equal(harness.queries.some(({ sql }) => /INSERT|UPDATE products/.test(sql)), false);
});

test("changed delivery charges and discount totals require review before any writes", async () => {
  for (const expectedTotals of [
    { subtotal: 90, shippingCost: 10, total: 100 },
    { subtotal: 80, shippingCost: 24.95, total: 104.95 },
  ]) {
    const harness = checkoutHarness({ products: [product("one", "90")] });
    await assert.rejects(harness.checkout([{ id: "one", quantity: 1, expectedUnitPrice: 90 }], { expectedTotals }), { code: "CHECKOUT_PRICE_CHANGED" });
    assert.equal(harness.queries.some(({ sql }) => /INSERT|UPDATE products/.test(sql)), false);
  }
});

test("matching reviewed prices succeed and confirmation lines use committed bundle prices", async () => {
  const harness = checkoutHarness({ products: [product("one", "55"), product("two", "55")] });
  const result = await harness.checkout([
    { id: "one", quantity: 1, bundleId: "bundle", expectedUnitPrice: 55 },
    { id: "two", quantity: 1, bundleId: "bundle", expectedUnitPrice: 55 },
  ], { expectedTotals: { subtotal: 99, shippingCost: 24.95, total: 123.95 } });
  assert.equal(result.order.items.length, 2);
  assert.equal(result.order.items[0].unitPrice, 49.5);
  assert.equal(result.order.items[0].regularUnitPrice, 55);
  assert.equal(result.order.total, 123.95);
});

test("duplicate identifiers cannot bypass the per-product quantity limit", async () => {
  const harness = checkoutHarness({ products: [product("one", "5", 200)] });
  await assert.rejects(harness.checkout([{ id: "one", quantity: 60 }, { sku: "one", quantity: 60 }]), { code: "CHECKOUT_QUANTITY_INVALID" });
  assert.equal(harness.queries.some(({ sql }) => /INSERT|UPDATE products/.test(sql)), false);
});

test("free shipping still requires a valid active method before any writes", async () => {
  for (const methods of [[], [{ ...EXPRESS, status: "inactive" }]]) {
    const harness = checkoutHarness({ products: [product("one", "150")], methods });
    await assert.rejects(harness.checkout([{ id: "one", quantity: 1 }]), { code: "CHECKOUT_SHIPPING_METHOD_INVALID" });
    assert.equal(harness.queries.some(({ sql }) => /INSERT|UPDATE products/.test(sql)), false);
  }
});

test("inventory validation remains authoritative for qualifying orders", async () => {
  const harness = checkoutHarness({ products: [product("one", "150", 0)] });
  await assert.rejects(harness.checkout([{ id: "one", quantity: 1 }]), { code: "CHECKOUT_STOCK_CONFLICT" });
  assert.equal(harness.queries.some(({ sql }) => /INSERT|UPDATE products/.test(sql)), false);
});

test("guest checkout preserves contact details without claiming a matching account", async () => {
  const harness = checkoutHarness({
    products: [product("one", "100")],
    customers: [{ id: "another-account", email: "guest@example.test", password_hash: "existing-hash", status: "active" }],
  });
  const result = await harness.checkout([{ id: "one", quantity: 1 }], {
    customerId: "another-account",
    customerEmail: "guest@example.test",
    customerName: "Guest Shopper",
    shippingAddress: { address1: "Guest delivery address" },
  });
  const stored = harness.queries.find(({ sql }) => sql.includes("INSERT INTO orders"));
  assert.equal(stored.params[1], null);
  assert.equal(stored.params[2], "Guest Shopper");
  assert.equal(stored.params[3], "guest@example.test");
  assert.equal(stored.params[9].address1, "Guest delivery address");
  assert.equal(harness.queries.some(({ sql }) => /customers/.test(sql)), false);
  assertCharges(harness, result, { subtotal: 100, shipping: 0, total: 100 });
});

test("authenticated checkout links only the separately verified account identifier", async () => {
  const harness = checkoutHarness({
    products: [product("one", "99.99")],
    customers: [{ id: "signed-in-account", password_hash: "existing-hash", status: "active" }],
  });
  const result = await harness.checkout([{ id: "one", quantity: 1 }], {
    customerId: "body-account-must-not-be-trusted",
    customerEmail: "different-contact@example.test",
  }, { customerId: "signed-in-account" });
  const stored = harness.queries.find(({ sql }) => sql.includes("INSERT INTO orders"));
  assert.equal(stored.params[1], "signed-in-account");
  assert.equal(stored.params[3], "different-contact@example.test");
  assert.equal(harness.queries.some(({ sql }) => /(?:INSERT INTO|UPDATE) customers/.test(sql)), false);
  assertCharges(harness, result, { subtotal: 99.99, shipping: 24.95, total: 124.94 });
});

test("a stale session cannot place linked orders for missing, blocked, or guest-only customer records", async () => {
  for (const customers of [
    [],
    [{ id: "account", status: "review", password_hash: "hash" }],
    [{ id: "account", status: "deleted", password_hash: "hash" }],
    [{ id: "account", status: "active", password_hash: null }],
  ]) {
    const harness = checkoutHarness({ products: [product("one", "100")], customers });
    await assert.rejects(harness.checkout([{ id: "one", quantity: 1 }], {}, { customerId: "account" }), {
      code: "CHECKOUT_CUSTOMER_SESSION_INVALID",
    });
    assert.equal(harness.queries.some(({ sql }) => /INSERT|UPDATE products/.test(sql)), false);
  }
});

const LISTING = "7f1c2a9e-4b3d-4c5e-8f60-1a2b3c4d5e6f";

test("reseller store lines are charged the store price and credit the margin to the store", async () => {
  const harness = checkoutHarness({
    products: [product("prod-a", 40)],
    listings: [{ listingId: LISTING, productId: "prod-a", salePrice: 48, storeId: "store-1" }],
  });
  await assert.rejects(
    harness.checkout([{ id: "prod-a", quantity: 1, expectedUnitPrice: 40, resellerListingId: LISTING }]),
    (error) => error.code === "CHECKOUT_PRICE_CHANGED",
    "the shopper must have seen the store price",
  );
  const result = await harness.checkout([{ id: "prod-a", quantity: 2, expectedUnitPrice: 48, resellerListingId: LISTING }]);
  assert.equal(result.order.subtotal, 96);
  const item = harness.queries.find(({ sql }) => sql.includes("INSERT INTO order_items"));
  assert.equal(item.params[6], 48, "order line records the store price");
  assert.equal(harness.earnings.length, 1);
  assert.deepEqual(
    JSON.parse(JSON.stringify(harness.earnings[0])),
    { basePrice: 40, chargedUnitPrice: 48, orderId: "order-test", orderItemId: "item-prod-a", productId: "prod-a", productName: "Product prod-a", quantity: 2, storeId: "store-1" },
  );
  assert.equal(result.confirmationEmail.store?.name, "Store store-1", "an all-store order gets the store's branded email");
});

test("a listing that is gone, suspended, or for another product is refused before any writes", async () => {
  for (const listings of [[], [{ listingId: LISTING, productId: "other", salePrice: 48, storeId: "store-1" }]]) {
    const harness = checkoutHarness({ products: [product("prod-a", 40)], listings });
    await assert.rejects(
      harness.checkout([{ id: "prod-a", quantity: 1, resellerListingId: LISTING }]),
      (error) => error.code === "CHECKOUT_PRICE_CHANGED",
    );
    assert.ok(!harness.queries.some(({ sql }) => /^\s*(INSERT|UPDATE)\b/.test(sql)), "no order, item or stock writes");
    assert.equal(harness.earnings.length, 0);
  }
});

test("regular catalog lines in the same order earn nothing for the store", async () => {
  const harness = checkoutHarness({
    products: [product("prod-a", 40), product("prod-b", 70)],
    listings: [{ listingId: LISTING, productId: "prod-a", salePrice: 48, storeId: "store-1" }],
  });
  const result = await harness.checkout([
    { id: "prod-a", quantity: 1, resellerListingId: LISTING },
    { id: "prod-b", quantity: 1 },
  ]);
  assert.equal(result.order.subtotal, 118);
  assert.equal(harness.earnings.length, 1);
  assert.equal(harness.earnings[0].productId, "prod-a");
  assert.equal(result.confirmationEmail.store, undefined, "a mixed order keeps Avokarto's email");
});

/* ---- Admin -> Settings: the free-shipping rule and payment methods ---- */

test("an admin-set minimum moves the free-shipping line for checkout and the cart", async () => {
  const settings = { ...storePolicy.DEFAULT_STORE_POLICY, freeShipping: { enabled: true, thresholdUsd: 50 } };
  const harness = checkoutHarness({ products: [product("one", "60")], settings });
  assertCharges(harness, await harness.checkout([{ id: "one", quantity: 1 }]), { subtotal: 60, shipping: 0, total: 60 });
  assert.equal(policy.qualifiesForFreeShipping(49.99, settings.freeShipping), false);
  assert.equal(policy.getFreeShippingRemaining(40, settings.freeShipping), 10);
  assert.equal(getCartSummary(40, 1, undefined, settings.freeShipping).progressPercent, 80);
});

test("with free shipping switched off every order pays its delivery method, and nothing is promised", async () => {
  const off = { enabled: false, thresholdUsd: 100 };
  const harness = checkoutHarness({ products: [product("one", "250")], settings: { ...storePolicy.DEFAULT_STORE_POLICY, freeShipping: off } });
  assertCharges(harness, await harness.checkout([{ id: "one", quantity: 1 }]), { subtotal: 250, shipping: 24.95, total: 274.95 });
  assert.equal(policy.getFreeShippingRemaining(10, off), 0);
  assert.equal(policy.freeShippingThresholdLabel(off), null);
  const summary = getCartSummary(250, 1, undefined, off);
  assert.equal(summary.hasFreeShipping, false);
  assert.equal(summary.freeShippingOffered, false);
});

test("a payment method the admin switched off is refused before any writes", async () => {
  const settings = { ...storePolicy.DEFAULT_STORE_POLICY, paymentMethods: ["card", "paypal"] };
  for (const submitted of ["Cash on delivery", "cod"]) {
    const harness = checkoutHarness({ products: [product("one", "20")], settings });
    await assert.rejects(harness.checkout([{ id: "one", quantity: 1 }], { paymentMethod: submitted }), { code: "PAYMENT_METHOD_UNAVAILABLE" });
    assert.equal(harness.queries.length, 0);
  }
  const allowed = checkoutHarness({ products: [product("one", "20")], settings });
  const result = await allowed.checkout([{ id: "one", quantity: 1 }], { paymentMethod: "Credit or debit card" });
  assert.equal(result.order.subtotal, 20);
});

test("payment labels from either checkout map to the same method", () => {
  assert.equal(storePolicy.paymentMethodKeyOf("Credit or debit card"), "card");
  assert.equal(storePolicy.paymentMethodKeyOf("Google Pay"), "googlepay");
  assert.equal(storePolicy.paymentMethodKeyOf("cod"), "cod");
  assert.equal(storePolicy.paymentMethodKeyOf("pending"), null);
});
