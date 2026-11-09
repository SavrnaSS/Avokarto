// Simulated queries only: no accounts, orders, inventory, or email are changed.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import ts from "typescript";
import { z } from "zod";

function load(filename, imports) {
  const loadedModule = { exports: {} };
  const source = readFileSync(new URL(`../${filename}`, import.meta.url), "utf8");
  const result = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } });
  runInNewContext(result.outputText, { module: loadedModule, exports: loadedModule.exports, TextEncoder, process: { env: {} },
    require(name) { if (!(name in imports)) throw new Error(`Unmocked dependency ${name}`); return imports[name]; },
  });
  return loadedModule.exports;
}
class HttpError extends Error {
  constructor(status, message, code) { super(message); this.status = status; this.code = code; }
}
function authHarness(existing, insertRows) {
  const queries = [];
  const auth = load("lib/backend/customer-auth.ts", {
    bcryptjs: { hash: async () => "simulated-password-hash" }, jose: {}, zod: { z },
    "@/lib/backend/http": { HttpError },
    "@/lib/backend/db": { dbQuery: async (sql, values) => {
      queries.push({ sql, values });
      return { rows: sql.includes("SELECT") ? existing : insertRows };
    } },
  });
  return { ...auth, queries };
}

test("unverified signup cannot claim historical guest orders or overwrite an existing account", async () => {
  for (const password_hash of [null, "existing-hash"]) {
    const harness = authHarness([{ id: "historical-customer", password_hash }], []);
    await assert.rejects(harness.registerCustomer("Unverified", " Person@Example.test ", "arbitrary-password"), { code: "ACCOUNT_EXISTS", status: 409 });
    assert.equal(harness.queries.length, 1);
    assert.equal(harness.queries[0].values[0], "person@example.test");
    assert.match(harness.queries[0].sql, /lower\(email\)/);
  }
});

test("concurrent signup never overwrites the winning account's password", async () => {
  const harness = authHarness([], []);
  await assert.rejects(harness.registerCustomer("New Shopper", "shopper@example.test", "password"), { code: "ACCOUNT_EXISTS" });
  assert.match(harness.queries[1].sql, /ON CONFLICT\s*\(email\)\s*DO NOTHING/);
  assert.doesNotMatch(harness.queries[1].sql, /DO UPDATE|UPDATE customers/i);
});

test("fresh signup creates a separate account with normalized email", async () => {
  const harness = authHarness([], [{ id: "new-customer", name: "New Shopper", email: "new@example.test" }]);
  const session = await harness.registerCustomer(" New Shopper ", " NEW@example.test ", "password");
  assert.equal(session.sub, "new-customer");
  assert.equal(harness.queries[1].values[0], "New Shopper");
  assert.equal(harness.queries[1].values[1], "new@example.test");
  assert.equal(harness.queries[1].values[2], "simulated-password-hash");
});

test("checkout API derives ownership only from its verified session, never the request body", async () => {
  for (const session of [null, { sub: "verified-customer" }]) {
    let suppliedOwnership;
    let emailCalls = 0;
    const deferred = [];
    const route = load("app/api/checkout/route.ts", {
      "next/server": { after: (callback) => deferred.push(callback) },
      "@/lib/backend/customer-auth": { getOptionalCustomer: async () => session },
      "@/lib/backend/checkout": { createCheckoutOrder: async (_body, ownership) => {
        suppliedOwnership = ownership;
        return { order: { orderNumber: "simulated-order" }, confirmationEmail: {} };
      } },
      "@/lib/backend/email": { sendEmail: async () => { emailCalls++; } },
      "@/lib/backend/admin-alerts": { notifyAdmins: async () => {} },
      "@/lib/backend/orderEmails": { buildOrderConfirmationEmail: () => ({}) },
      "@/lib/backend/http": { json: (body, options) => ({ body, ...options }), handleApiError: (error) => { throw error; } },
      // Origin and rate-limit checks have their own coverage; pass through here.
      "@/lib/backend/request-guard": { assertSameOrigin: () => {}, clientIp: () => "simulated-ip", consumeRateLimit: async () => {}, rateLimits: { checkout: {} } },
    });
    const response = await route.POST({ json: async () => ({ customerId: "attacker-supplied", customerEmail: "someone-else@example.test" }) });
    assert.equal(response.status, 201);
    assert.equal(suppliedOwnership.customerId, session?.sub);
    assert.equal(emailCalls, 0);
    assert.equal(deferred.length, 1);
  }
});
