// Password reset by emailed code. The database, bcrypt and email are
// simulated: queries are recorded and rows supplied per test.
import assert from "node:assert/strict";
import { createHmac, randomInt, timingSafeEqual } from "node:crypto";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import ts from "typescript";

class HttpError extends Error {
  constructor(status, message, code) { super(message); this.status = status; this.code = code; }
}

const SECRET = "fixture-secret-fixture-secret-fixture-secret-0123456789";
const CUSTOMER = { email: "riya@example.com", id: "6f1d7a2e-3b4c-4d5e-8f90-1a2b3c4d5e6f", name: "Riya Sharma", status: "active" };

function load({ customer = CUSTOMER, reset = null, env = {} } = {}) {
  const queries = [];
  const logs = [];
  const loadedModule = { exports: {} };
  const source = readFileSync(new URL("../lib/backend/password-reset.ts", import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } });
  const run = async (sql, values) => {
    queries.push({ sql, values });
    if (sql.includes("FROM customers")) return { rows: customer ? [customer] : [] };
    if (sql.includes("FROM password_reset_codes")) return { rows: reset ? [reset] : [] };
    return { rows: [], rowCount: 1 };
  };
  const imports = {
    "node:crypto": { createHmac, randomInt, timingSafeEqual },
    bcryptjs: { default: { hash: async (value) => `bcrypt(${value})` } },
    "@/lib/backend/http": { HttpError },
    "@/lib/backend/email": { isEmailConfigured: () => false, sendEmail: async () => ({ status: "sent", id: "x" }) },
    "@/lib/backend/db": { dbQuery: run, withTransaction: async (callback) => callback({ query: run }) },
  };
  runInNewContext(outputText, {
    module: loadedModule, exports: loadedModule.exports, Buffer, console: { info: (...a) => logs.push(a.join(" ")), error: (...a) => logs.push(a.join(" ")) },
    process: { env: { JWT_SECRET: SECRET, NODE_ENV: "development", ...env } },
    require(name) { if (!(name in imports)) throw new Error(`Unmocked dependency ${name}`); return imports[name]; },
  });
  return { logs, queries, reset: loadedModule.exports };
}

test("an unknown email gets the same quiet reply and no code is made", async () => {
  const { queries, reset } = load({ customer: null });
  await reset.requestPasswordReset("nobody@example.com");
  assert.equal(queries.some((query) => query.sql.includes("password_reset_codes")), false);
});

test("admin-held accounts can't be reset", async () => {
  const { queries, reset } = load({ customer: { ...CUSTOMER, status: "review" } });
  await reset.requestPasswordReset(CUSTOMER.email);
  assert.equal(queries.some((query) => query.sql.includes("password_reset_codes")), false);
});

test("a request stores only a keyed hash of a 6-digit code, never the code itself", async () => {
  const { logs, queries, reset } = load();
  await reset.requestPasswordReset(CUSTOMER.email);
  const insert = queries.find((query) => query.sql.includes("INSERT INTO password_reset_codes"));
  const code = /code for \S+: (\d{6})/.exec(logs.join("\n"))?.[1];
  assert.ok(code, "development logs the code when email isn't configured");
  assert.equal(insert.values[1], reset.hashResetCode(CUSTOMER.id, code));
  assert.ok(!insert.values.includes(code));
});

test("production never logs the code when email isn't configured", async () => {
  const { logs, reset } = load({ env: { NODE_ENV: "production" } });
  await reset.requestPasswordReset(CUSTOMER.email);
  assert.ok(!logs.some((line) => /\d{6}/.test(line)));
});

test("a wrong code counts the attempt (committed, not rolled back) and is refused", async () => {
  const { queries, reset } = load({ reset: { attempts: 0, code_hash: "something-else", expired: false } });
  await assert.rejects(reset.confirmPasswordReset(CUSTOMER.email, "111111", "N3w!password"), (error) => error.code === "INVALID_RESET_CODE");
  assert.ok(queries.some((query) => query.sql.includes("attempts = attempts + 1")));
  assert.equal(queries.some((query) => query.sql.includes("UPDATE customers")), false);
});

test("after five wrong codes the code is locked; expired codes are refused", async () => {
  const locked = load({ reset: { attempts: 5, code_hash: "x", expired: false } }).reset;
  await assert.rejects(locked.confirmPasswordReset(CUSTOMER.email, "111111", "N3w!password"), (error) => error.status === 429);
  const expired = load({ reset: { attempts: 0, code_hash: "x", expired: true } }).reset;
  await assert.rejects(expired.confirmPasswordReset(CUSTOMER.email, "111111", "N3w!password"), (error) => error.code === "INVALID_RESET_CODE");
});

test("the right code sets the new password, clears the code and returns the session", async () => {
  const hash = createHmac("sha256", SECRET).update(`${CUSTOMER.id}:424242`).digest("base64url");
  const { queries, reset } = load({ reset: { attempts: 1, code_hash: hash, expired: false } });
  const session = await reset.confirmPasswordReset(CUSTOMER.email, "424242", "N3w!password");
  assert.deepEqual({ ...session }, { email: CUSTOMER.email, name: CUSTOMER.name, sub: CUSTOMER.id });
  const update = queries.find((query) => query.sql.includes("UPDATE customers"));
  assert.equal(update.values[1], "bcrypt(N3w!password)");
  assert.ok(queries.some((query) => query.sql.includes("DELETE FROM password_reset_codes")));
});
