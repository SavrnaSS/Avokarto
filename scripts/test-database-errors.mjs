// Simulated failures only; these tests never connect to a database.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import ts from "typescript";
import { ZodError } from "zod";

function load(filename, imports, globals = {}) {
  const loadedModule = { exports: {} };
  const source = readFileSync(new URL(`../${filename}`, import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  });
  runInNewContext(outputText, {
    module: loadedModule,
    exports: loadedModule.exports,
    process: { env: {} },
    require(name) {
      if (!(name in imports)) throw new Error(`Unmocked dependency ${name}`);
      return imports[name];
    },
    ...globals,
  });
  return loadedModule.exports;
}

function apiHarness() {
  const logs = [];
  const database = load("lib/backend/db.ts", {
    pg: { types: { setTypeParser() {} } },
  });
  const http = load("lib/backend/http.ts", {
    "next/server": { NextResponse: Response },
    zod: { ZodError },
    "@/lib/backend/db": database,
  }, { console: { error: (...args) => logs.push(args) } });
  return { ...database, ...http, logs };
}

const tenantMessages = [
  "(ENOTFOUND) tenant/user postgres.fixture-project not found",
  "Tenant or user not found",
];

test("Supabase tenant lookup failures are recognized despite PostgreSQL code XX000", () => {
  const { getDatabaseConnectionErrorCode } = apiHarness();
  for (const message of tenantMessages) {
    const error = Object.assign(new Error(message), { code: "XX000", severity: "FATAL" });
    assert.equal(getDatabaseConnectionErrorCode(error), "TENANT_NOT_FOUND");
  }
});

test("unrelated internal errors and invalid queries remain server errors", () => {
  const { getDatabaseConnectionErrorCode } = apiHarness();
  for (const [code, message] of [
    ["XX000", "unexpected internal database error"],
    ["42601", "syntax error at or near SELECT"],
    ["42P01", "relation reseller_settings does not exist"],
    ["23505", "duplicate key value violates unique constraint"],
  ]) {
    assert.equal(getDatabaseConnectionErrorCode({ code, message }), null);
  }
});

test("network failures, session limits and connection timeouts remain recognized", () => {
  const { getDatabaseConnectionErrorCode } = apiHarness();
  for (const code of ["ENOTFOUND", "ECONNRESET", "ECONNREFUSED", "ETIMEDOUT", "EMAXCONNSESSION", "53300", "57P03", "08006"]) {
    assert.equal(getDatabaseConnectionErrorCode({ code }), code);
  }
  assert.equal(getDatabaseConnectionErrorCode(new Error("Connection terminated unexpectedly")), "CONNECTION_FAILURE");
});

test("tenant failures are found in wrapped and aggregate errors without following cycles", () => {
  const { getDatabaseConnectionErrorCode } = apiHarness();
  const failure = { code: "XX000", message: tenantMessages[0] };
  assert.equal(getDatabaseConnectionErrorCode(new Error("wrapped", { cause: failure })), "TENANT_NOT_FOUND");
  const wrapper = { errors: [] };
  wrapper.cause = wrapper;
  wrapper.errors.push(wrapper, failure);
  assert.equal(getDatabaseConnectionErrorCode(wrapper), "TENANT_NOT_FOUND");
  assert.equal(getDatabaseConnectionErrorCode({ cause: wrapper, errors: [null, undefined, "text"] }), "TENANT_NOT_FOUND");
});

test("tenant failures return a safe 503 and actionable, throttled server logging", async () => {
  const { handleApiError, logs } = apiHarness();
  for (const message of tenantMessages) {
    const response = handleApiError({ code: "XX000", message, severity: "FATAL" });
    assert.equal(response.status, 503);
    assert.equal(response.headers.get("Retry-After"), "5");
    assert.equal(response.headers.get("Cache-Control"), "no-store");
    assert.deepEqual(await response.json(), {
      error: {
        code: "DATABASE_UNAVAILABLE",
        message: "Database temporarily unavailable. Please try again shortly.",
      },
    });
  }
  assert.equal(logs.length, 1);
  assert.match(logs[0][0], /TENANT_NOT_FOUND.*project status.*pooler connection strings \(DATABASE_URL, DATABASE_SESSION_URL\)/);
  assert.doesNotMatch(JSON.stringify(logs), /postgres\.fixture-project/);
});

test("an unrelated XX000 error still returns 500", async () => {
  const { handleApiError } = apiHarness();
  const response = handleApiError({ code: "XX000", message: "unexpected internal database error" });
  assert.equal(response.status, 500);
  assert.equal((await response.json()).error.code, "INTERNAL_SERVER_ERROR");
});

test("seller store GET returns database unavailable when settings cannot connect", async () => {
  const http = apiHarness();
  const route = load("app/api/seller/store/route.ts", {
    "next/server": { after: () => {} },
    "@/lib/backend/admin-alerts": { notifyAdmins: async () => {} },
    "@/lib/backend/billing": { billingConfigured: () => false },
    "@/lib/backend/customer-auth": { requireCustomer: async () => ({ sub: "fixture-customer" }) },
    "@/lib/backend/http": http,
    "@/lib/backend/request-guard": {},
    "@/lib/backend/resellers": {
      getStoreForCustomer: async () => null,
      getResellerSettings: async () => { throw { code: "XX000", message: tenantMessages[0] }; },
    },
  });
  const response = await route.GET({});
  assert.equal(response.status, 503);
  assert.equal((await response.json()).error.code, "DATABASE_UNAVAILABLE");
});
