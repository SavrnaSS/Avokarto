// Which custom domains a seller may connect, and the DNS records they get.
// No database or DNS access: both are mocked.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import ts from "typescript";

class HttpError extends Error {
  constructor(status, message, code, details) { super(message); this.status = status; this.code = code; this.details = details; }
}

function load(env = {}) {
  const loadedModule = { exports: {} };
  const source = readFileSync(new URL("../lib/backend/store-domains.ts", import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } });
  const imports = {
    "node:crypto": { randomBytes: () => Buffer.from("00112233445566778899aabbccddeeff", "hex") },
    "node:dns": { promises: {} },
    "@/lib/backend/db": { dbQuery: async () => ({ rows: [] }) },
    "@/lib/backend/http": { HttpError },
  };
  runInNewContext(outputText, { module: loadedModule, exports: loadedModule.exports, URL, Buffer, process: { env },
    require(name) { if (!(name in imports)) throw new Error(`Unmocked dependency ${name}`); return imports[name]; },
  });
  return loadedModule.exports;
}

const domains = load({ NEXT_PUBLIC_SITE_URL: "https://www.avokarto.com", STORE_DOMAIN_TARGET: "stores.avokarto.com" });

test("domains are normalised from whatever the seller pastes", () => {
  assert.equal(domains.normalizeDomain("HTTPS://Shop.MyBrand.com/some/path?x=1"), "shop.mybrand.com");
  assert.equal(domains.normalizeDomain("  mybrand.co.in.  "), "mybrand.co.in");
  assert.equal(domains.normalizeDomain("shop.mybrand.com:443"), "shop.mybrand.com");
});

test("Avokarto's own, local and malformed hosts can't be claimed", () => {
  for (const bad of ["", "localhost", "not a domain", "192.168.1.10", "avokarto.com", "evil.avokarto.com", "x.stores.avokarto.com",
    "shop.avokarto.in", "my.store.test", "intranet.local", "-bad-.com", "a".repeat(64) + ".com"]) {
    assert.throws(() => domains.normalizeDomain(bad), (error) => error.status === 400, bad);
  }
});

test("sellers get a CNAME to the configured target and a TXT ownership code", () => {
  const view = domains.withInstructions({ domain: "shop.mybrand.com", lastCheckedAt: null, lastError: "", status: "pending", verificationToken: "abc123", verifiedAt: null });
  assert.deepEqual(JSON.parse(JSON.stringify(view.records.map((record) => [record.type, record.name, record.value]))), [
    ["CNAME", "shop.mybrand.com", "stores.avokarto.com"],
    ["TXT", "_avokarto.shop.mybrand.com", "avokarto-verify=abc123"],
  ]);
  assert.equal(view.apexNote, null);
  assert.match(domains.withInstructions({ domain: "mybrand.com", lastCheckedAt: null, lastError: "", status: "pending", verificationToken: "t", verifiedAt: null }).apexNote, /ALIAS/);
});

test("the CNAME target falls back to the main site host", () => {
  assert.equal(load({ NEXT_PUBLIC_SITE_URL: "https://www.avokarto.com" }).domainTarget(), "www.avokarto.com");
});
