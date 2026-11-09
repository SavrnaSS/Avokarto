// Whop billing: webhook signatures, plan limits and membership updates.
// The database is simulated: queries are recorded, rows are supplied.
import assert from "node:assert/strict";
import { createHmac, timingSafeEqual } from "node:crypto";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import ts from "typescript";

class HttpError extends Error {
  constructor(status, message, code, details, headers) {
    super(message); this.status = status; this.code = code; this.details = details; this.headers = headers;
  }
}

function load(path, imports, env = {}) {
  const loadedModule = { exports: {} };
  const source = readFileSync(new URL(path, import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } });
  runInNewContext(outputText, { module: loadedModule, exports: loadedModule.exports, Buffer, Date, Headers, AbortSignal, console, process: { env },
    require(name) { if (!(name in imports)) throw new Error(`Unmocked dependency ${name}`); return imports[name]; },
  });
  return loadedModule.exports;
}

const plans = load("../lib/billing/plans.ts", {});

function loadBilling({ env = {}, rows = () => [] } = {}) {
  const queries = [];
  const billing = load("../lib/backend/billing.ts", {
    "node:crypto": { createHmac, timingSafeEqual },
    "@/lib/backend/http": { HttpError },
    "@/lib/billing/plans": plans,
    "@/lib/seo": { siteUrl: () => "https://shop.fixture-retail.net" },
    "@/lib/backend/db": { dbQuery: async (sql, values) => {
      queries.push({ sql, values });
      const result = rows(sql, values) ?? [];
      return { rows: result, rowCount: result.length || (sql.trimStart().startsWith("INSERT") ? 1 : 0) };
    } },
  }, env);
  return { billing, queries };
}

const SECRET = "ws_dGVzdC1zZWNyZXQta2V5";
function signed(body, { key = Buffer.from(SECRET, "utf8"), id = "msg_1", at = Math.floor(Date.now() / 1000) } = {}) {
  const signature = createHmac("sha256", key).update(`${id}.${at}.${body}`).digest("base64");
  return new Headers({ "webhook-id": id, "webhook-timestamp": String(at), "webhook-signature": `v1,${signature}` });
}

test("a correctly signed delivery verifies, with either reading of the secret", () => {
  const { billing } = loadBilling({ env: { WHOP_WEBHOOK_SECRET: SECRET } });
  const body = '{"type":"membership.activated"}';
  assert.equal(billing.verifyWhopSignature(signed(body), body), true);
  // Standard Webhooks: the key is the base64 part after the prefix.
  assert.equal(billing.verifyWhopSignature(signed(body, { key: Buffer.from("dGVzdC1zZWNyZXQta2V5", "base64") }), body), true);
});

test("tampered, stale, wrongly keyed or unsigned deliveries are refused", () => {
  const { billing } = loadBilling({ env: { WHOP_WEBHOOK_SECRET: SECRET } });
  const body = '{"type":"membership.activated"}';
  assert.equal(billing.verifyWhopSignature(signed(body), body.replace("activated", "updated")), false);
  assert.equal(billing.verifyWhopSignature(signed(body, { at: Math.floor(Date.now() / 1000) - 3600 }), body), false);
  assert.equal(billing.verifyWhopSignature(signed(body, { key: Buffer.from("someone-else") }), body), false);
  assert.equal(billing.verifyWhopSignature(new Headers(), body), false);
  // No secret configured: nothing verifies.
  assert.equal(loadBilling().billing.verifyWhopSignature(signed(body), body), false);
});

test("trialing, active and past-due memberships keep a store open; the rest don't", () => {
  for (const status of ["trialing", "active", "past_due"]) assert.equal(plans.grantsAccess(status), true, status);
  for (const status of ["canceled", "expired", "completed", "unresolved", "", undefined]) assert.equal(plans.grantsAccess(status), false, String(status));
});

test("Starter caps products at 25, Pro doesn't, and no plan blocks adding when required", async () => {
  const subscription = (plan, status) => () => [{ plan, status, whop_membership_id: "mem_1", current_period_end: null, cancel_at_period_end: false, manage_url: "", whop_updated_at: null }];
  const starter = loadBilling({ rows: subscription("starter", "active") }).billing;
  await starter.assertListingAllowed("c", true, 24);
  await assert.rejects(starter.assertListingAllowed("c", true, 25), (error) => error.status === 402 && error.code === "PLAN_LIMIT");
  await assert.rejects(starter.assertCustomDomainAllowed("c", true), (error) => error.status === 402);

  const pro = loadBilling({ rows: subscription("pro", "trialing") }).billing;
  await pro.assertListingAllowed("c", true, 400);
  await pro.assertCustomDomainAllowed("c", true);

  const lapsed = loadBilling({ rows: subscription("pro", "canceled") }).billing;
  await assert.rejects(lapsed.assertListingAllowed("c", true, 0), (error) => error.code === "SUBSCRIPTION_REQUIRED");
  // Billing switched off: everyone keeps full access, as before.
  await lapsed.assertListingAllowed("c", false, 400);
});

test("a membership webhook is matched to the seller through its metadata and its Whop plan", async () => {
  const customer = "6f1d7a2e-3b4c-4d5e-8f90-1a2b3c4d5e6f";
  const { billing, queries } = loadBilling({ env: { WHOP_PLAN_STARTER: "plan_s", WHOP_PLAN_PRO: "plan_p" } });
  const changed = await billing.applyMembership({
    id: "mem_9", status: "trialing", variant_id: "plan_p", metadata: { customer_id: customer },
    current_period_end: "2026-11-11T00:00:00Z", updated_at: "2026-11-04T00:00:00Z",
  });
  assert.equal(changed, customer);
  const upsert = queries.find((query) => query.sql.includes("INSERT INTO seller_subscriptions"));
  assert.deepEqual(Array.from(upsert.values.slice(0, 4)), [customer, "pro", "mem_9", "trialing"]);
  // Out-of-order deliveries can't roll a newer state back.
  assert.match(upsert.sql, /EXCLUDED\.whop_updated_at >= seller_subscriptions\.whop_updated_at/);
});

test("an old cancelled membership can't replace a newer plan that grants access", async () => {
  const customer = "6f1d7a2e-3b4c-4d5e-8f90-1a2b3c4d5e6f";
  const { billing, queries } = loadBilling({
    env: { WHOP_PLAN_STARTER: "plan_s", WHOP_PLAN_PRO: "plan_p" },
    rows: (sql) => sql.includes("WHERE customer_id = $1")
      ? [{ plan: "pro", status: "active", whop_membership_id: "mem_new", current_period_end: null, cancel_at_period_end: false, manage_url: "", whop_updated_at: null }]
      : [],
  });
  const changed = await billing.applyMembership({ id: "mem_old", status: "canceled", variant_id: "plan_s", metadata: { customer_id: customer } });
  assert.equal(changed, null);
  assert.equal(queries.some((query) => query.sql.includes("INSERT INTO seller_subscriptions")), false);
});

test("memberships that aren't ours are ignored", async () => {
  const { billing, queries } = loadBilling();
  assert.equal(await billing.applyMembership({ id: "mem_x", status: "active", metadata: { customer_id: "not-a-uuid" } }), null);
  assert.equal(queries.some((query) => query.sql.includes("INSERT")), false);
});
