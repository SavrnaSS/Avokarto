// Origin checks and rate limiting for public write endpoints. The database
// is simulated: no counters are written.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import ts from "typescript";

class HttpError extends Error {
  constructor(status, message, code, details, headers) {
    super(message); this.status = status; this.code = code; this.details = details; this.headers = headers;
  }
}

function loadGuard({ hits = () => 1, env = {} } = {}) {
  const queries = [];
  const loadedModule = { exports: {} };
  const source = readFileSync(new URL("../lib/backend/request-guard.ts", import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } });
  const imports = {
    "node:crypto": { createHash },
    "@/lib/backend/http": { HttpError },
    "@/lib/backend/db": { dbQuery: async (sql, values) => {
      queries.push({ sql, values });
      if (sql.trimStart().startsWith("DELETE")) return { rows: [] };
      const count = hits(values[0], sql);
      return { rows: count === null ? [] : [{ hits: count, retry_after: "600" }] };
    } },
  };
  runInNewContext(outputText, { module: loadedModule, exports: loadedModule.exports, URL, Math: Object.assign(Object.create(Math), { random: () => 0.5 }), process: { env },
    require(name) { if (!(name in imports)) throw new Error(`Unmocked dependency ${name}`); return imports[name]; },
  });
  return { guard: loadedModule.exports, queries };
}

const request = (headers) => new Request("http://internal:3000/api/x", { method: "POST", headers });

test("same-origin and header-less requests pass; other sites are refused", () => {
  const { guard } = loadGuard({ env: { NEXT_PUBLIC_SITE_URL: "https://shop.fixture-retail.net" } });
  guard.assertSameOrigin(request({ host: "localhost:3000", origin: "http://localhost:3000" }));
  guard.assertSameOrigin(request({ host: "internal:3000" }));
  // Behind a reverse proxy the public host arrives as X-Forwarded-Host.
  guard.assertSameOrigin(request({ host: "internal:3000", "x-forwarded-host": "shop.fixture-retail.net", origin: "https://shop.fixture-retail.net" }));
  guard.assertSameOrigin(request({ host: "internal:3000", origin: "https://shop.fixture-retail.net" }));

  for (const origin of ["https://evil.fixture.net", "null", "not a url"]) {
    assert.throws(() => guard.assertSameOrigin(request({ host: "localhost:3000", origin })), (error) => error.status === 403, origin);
  }
});

test("the first forwarded address identifies the client", () => {
  const { guard } = loadGuard();
  assert.equal(guard.clientIp(request({ "x-forwarded-for": "198.51.100.7, 10.0.0.2" })), "198.51.100.7");
  assert.equal(guard.clientIp(request({ "x-real-ip": "198.51.100.8" })), "198.51.100.8");
  assert.equal(guard.clientIp(request({})), "unknown");
});

test("going over the limit returns 429 with Retry-After, and keys never hold raw identifiers", async () => {
  const { guard, queries } = loadGuard({ hits: () => 6 });
  await assert.rejects(
    guard.consumeRateLimit(guard.rateLimits.contact, "198.51.100.7"),
    (error) => error.status === 429 && error.code === "RATE_LIMITED" && error.headers["Retry-After"] === "600",
  );
  assert.ok(!queries[0].values[0].includes("198.51.100.7"));

  const allowed = loadGuard({ hits: () => 5 });
  await allowed.guard.consumeRateLimit(allowed.guard.rateLimits.contact, "198.51.100.7");
});

test("login: only failed attempts count against the account, and a blocked account is refused before the password check", async () => {
  const failures = new Map();
  const { guard } = loadGuard({ hits: (key, sql) => {
    if (!key.startsWith("login-fail:")) return 1;
    if (sql.trimStart().startsWith("SELECT")) return failures.has(key) ? failures.get(key) : null;
    failures.set(key, (failures.get(key) ?? 0) + 1);
    return failures.get(key);
  } });
  const login = request({ "x-forwarded-for": "198.51.100.7" });
  const wrong = async () => { throw new HttpError(401, "Invalid email or password.", "INVALID_CREDENTIALS"); };

  assert.equal(await guard.guardLogin(login, "admin", "owner@shop.test", async () => "session"), "session");
  assert.equal(failures.size, 0, "a successful sign-in is not a failure");

  for (let attempt = 1; attempt <= 8; attempt++) {
    await assert.rejects(guard.guardLogin(login, "admin", "owner@shop.test", wrong), (error) => error.status === 401);
  }

  let checked = false;
  await assert.rejects(
    guard.guardLogin(login, "admin", "owner@shop.test", async () => { checked = true; return "session"; }),
    (error) => error.status === 429,
  );
  assert.equal(checked, false, "the password is never checked once the account is blocked");

  // Customer accounts are tracked separately from admin accounts.
  assert.equal(await guard.guardLogin(login, "customer", "owner@shop.test", async () => "customer-session"), "customer-session");
});
