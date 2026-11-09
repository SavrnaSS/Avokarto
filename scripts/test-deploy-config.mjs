import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { validateDeploymentEnv } from "./check-deploy-config.mjs";

// Synthetic fixtures only; this suite never reads the application's .env files.
const VALID = {
  NEXT_PUBLIC_SITE_URL: "https://shop.fixture-retail.net",
  SITE_INDEXABLE: "true",
  JWT_SECRET: "8bc73f405ea12d690caf4735a189bc07f418da630257ecbc7629faea475de601",
  DATABASE_URL: "postgresql://fixture_user:fixture_credential@database.fixture-retail.net:5432/store",
  DATABASE_SSL: "true",
  DATABASE_POOL_MAX: "10",
  DATABASE_CONNECTION_TIMEOUT_MS: "5000",
  ADMIN_SESSION_DAYS: "7",
  CUSTOMER_SESSION_DAYS: "30",
};

const check = (overrides = {}, nodeVersion = "22.0.0") => validateDeploymentEnv({ ...VALID, ...overrides }, { nodeVersion });
const hasError = (report, key) => report.errors.some((issue) => issue.key === key);

test("a syntactically valid production configuration passes but retains manual launch checks", () => {
  const report = check();
  assert.deepEqual(report.errors, []);
  assert.ok(report.manualChecks.some((message) => message.includes("pending/unpaid")));
  assert.ok(report.manualChecks.some((message) => message.includes("public/uploads")));
  assert.ok(report.warnings.some((issue) => issue.key.includes("RESEND_API_KEY")));
  assert.deepEqual(check({}, "24.0.0").errors, []);
});

test("missing deployment prerequisites fail without database or network access", () => {
  const report = validateDeploymentEnv({}, { nodeVersion: "22.0.0" });
  for (const key of ["NEXT_PUBLIC_SITE_URL", "SITE_INDEXABLE", "JWT_SECRET", "DATABASE_URL", "DATABASE_SSL"]) {
    assert.ok(hasError(report, key), key);
  }
});

test("the public origin rejects local, placeholder, non-HTTPS and path-bearing URLs", () => {
  for (const NEXT_PUBLIC_SITE_URL of [
    "http://shop.fixture-retail.net", "https://localhost", "https://127.0.0.1",
    "https://[::1]", "https://shop.example.com", "https://store.invalid",
    "https://shop.fixture-retail.net/store", "https://shop.fixture-retail.net?debug=1",
    "https://shop.fixture-retail.net#top", "https://user:password@shop.fixture-retail.net",
    "HTTPS://shop.fixture-retail.net",
  ]) assert.ok(hasError(check({ NEXT_PUBLIC_SITE_URL }), "NEXT_PUBLIC_SITE_URL"), NEXT_PUBLIC_SITE_URL);
});

test("preview indexing is explicit and cannot be mistaken for a launch-ready live site", () => {
  assert.ok(hasError(check({ SITE_INDEXABLE: "yes" }), "SITE_INDEXABLE"));
  const preview = check({ SITE_INDEXABLE: "false" });
  assert.deepEqual(preview.errors, []);
  assert.ok(preview.warnings.some((issue) => issue.key === "SITE_INDEXABLE"));
  for (const platform of [{ VERCEL_ENV: "preview" }, { CONTEXT: "deploy-preview" }]) {
    assert.ok(check(platform).warnings.some((issue) => issue.key === "SITE_INDEXABLE"));
  }
});

test("weak or sample secrets and obsolete runtimes fail", () => {
  for (const JWT_SECRET of ["short", "x".repeat(64), "replace-with-a-strong-random-secret-at-least-32-characters"]) {
    assert.ok(hasError(check({ JWT_SECRET }), "JWT_SECRET"));
  }
  assert.ok(hasError(check({}, "20.19.0"), "NODE_VERSION"));
  assert.ok(hasError(check({ ADMIN_BOOTSTRAP_PASSWORD: "ChangeMe123!" }), "ADMIN_BOOTSTRAP_PASSWORD"));
});

test("public PostgreSQL connections require TLS and complete credentials", () => {
  assert.ok(hasError(check({ DATABASE_SSL: "false" }), "DATABASE_SSL"));
  assert.ok(hasError(check({ DATABASE_URL: `${VALID.DATABASE_URL}?sslmode=disable` }), "DATABASE_SSL"));
  assert.ok(hasError(check({ DATABASE_URL: "mysql://user:pass@host/store" }), "DATABASE_URL"));
  assert.ok(hasError(check({ DATABASE_URL: "postgresql://user@database.fixture-retail.net/store" }), "DATABASE_URL"));
  assert.ok(hasError(check({ DATABASE_URL: "postgresql://USER:PASSWORD@HOST/DATABASE" }), "DATABASE_URL"));
  for (const hostname of ["db", "localhost", "127.0.0.1", "10.20.30.40", "172.16.0.2", "192.168.1.2"]) {
    const report = check({ DATABASE_URL: `postgresql://fixture:credential@${hostname}/store`, DATABASE_SSL: "false" });
    assert.deepEqual(report.errors, []);
    assert.ok(report.warnings.some((issue) => issue.key === "DATABASE_SSL"));
  }
  assert.ok(hasError(check({ DATABASE_URL: "postgresql://fixture:credential@172.32.0.2/store", DATABASE_SSL: "false" }), "DATABASE_SSL"));
});

test("transaction pooling needs a session URL for LISTEN, and ephemeral serverless hosts fail", () => {
  const transaction = "postgresql://fixture:credential@aws-0-us-west-1.pooler.supabase.com:6543/postgres";
  const session = "postgresql://fixture:credential@aws-0-us-west-1.pooler.supabase.com:5432/postgres";
  // Transaction pooler alone can't hold the realtime LISTEN session.
  assert.ok(hasError(check({ DATABASE_URL: transaction }), "DATABASE_SESSION_URL"));
  // With a session-mode URL alongside, it's the recommended setup.
  const paired = check({ DATABASE_URL: transaction, DATABASE_SESSION_URL: session });
  assert.ok(!hasError(paired, "DATABASE_URL") && !hasError(paired, "DATABASE_SESSION_URL"));
  // The session URL itself must not be the transaction pooler.
  assert.ok(hasError(check({ DATABASE_URL: transaction, DATABASE_SESSION_URL: transaction }), "DATABASE_SESSION_URL"));
  for (const platform of [{ VERCEL: "1" }, { AWS_LAMBDA_FUNCTION_NAME: "fixture" }, { AWS_EXECUTION_ENV: "AWS_Lambda_nodejs22.x" }]) {
    assert.ok(hasError(check(platform), "HOSTING_RUNTIME"));
  }
});

test("numeric settings reject values that would create invalid sessions or pool behavior", () => {
  for (const key of ["DATABASE_POOL_MAX", "DATABASE_CONNECTION_TIMEOUT_MS", "ADMIN_SESSION_DAYS", "CUSTOMER_SESSION_DAYS"]) {
    for (const invalid of ["0", "-1", "1.5", "NaN", "Infinity"]) assert.ok(hasError(check({ [key]: invalid }), key));
  }
});

test("partial email configuration and malformed sender/reply addresses fail", () => {
  assert.ok(hasError(check({ RESEND_API_KEY: "fixture-provider-key" }), "RESEND_API_KEY / EMAIL_FROM"));
  assert.ok(hasError(check({ EMAIL_FROM: "Shop <orders@fixture-retail.net>" }), "RESEND_API_KEY / EMAIL_FROM"));
  assert.ok(hasError(check({ RESEND_API_KEY: "fixture-provider-key", EMAIL_FROM: "Shop <orders@example.com>" }), "RESEND_API_KEY / EMAIL_FROM"));
  assert.ok(hasError(check({ EMAIL_REPLY_TO: "not-an-email" }), "EMAIL_REPLY_TO"));
  assert.deepEqual(check({ RESEND_API_KEY: "fixture-provider-key", EMAIL_FROM: "Shop <orders@fixture-retail.net>", EMAIL_REPLY_TO: "support@fixture-retail.net" }).errors, []);
});

test("validation findings never contain supplied secret values", () => {
  const sensitive = {
    JWT_SECRET: "private-marker-short",
    DATABASE_URL: "postgresql://sensitive-user:sensitive-password@database.fixture-retail.net/store?sslmode=disable",
    RESEND_API_KEY: "sensitive-provider-token",
    EMAIL_FROM: "private-mailbox",
  };
  const printed = JSON.stringify(check(sensitive));
  for (const value of Object.values(sensitive)) assert.equal(printed.includes(value), false);
  assert.equal(printed.includes("sensitive-password"), false);
});

test("the committed environment template contains no usable credentials", () => {
  const template = readFileSync(new URL("../.env.example", import.meta.url), "utf8");
  for (const key of ["JWT_SECRET", "ADMIN_BOOTSTRAP_PASSWORD", "RESEND_API_KEY", "EMAIL_FROM"]) {
    assert.match(template, new RegExp(`^${key}=\\s*$`, "m"));
  }
  assert.match(template, /^SITE_INDEXABLE=false$/m);
});

test("upload storage: local warns, s3 needs bucket credentials and an https endpoint", () => {
  assert.ok(check().warnings.some((issue) => issue.key === "UPLOAD_STORAGE"));
  assert.ok(hasError(check({ UPLOAD_STORAGE: "ftp" }), "UPLOAD_STORAGE"));

  const missing = check({ UPLOAD_STORAGE: "s3" });
  for (const key of ["UPLOAD_S3_BUCKET", "UPLOAD_S3_ACCESS_KEY_ID", "UPLOAD_S3_SECRET_ACCESS_KEY"]) {
    assert.ok(hasError(missing, key), key);
  }

  const s3 = {
    UPLOAD_STORAGE: "s3",
    UPLOAD_S3_BUCKET: "catalog-media",
    UPLOAD_S3_ACCESS_KEY_ID: "AKIAFIXTURE7Q2M4K9",
    UPLOAD_S3_SECRET_ACCESS_KEY: "fixture7Hs9Kq2LmX4pR8vT1yW6zB3nC5dE0gJ",
  };
  const configured = check(s3);
  assert.deepEqual(configured.errors, []);
  assert.ok(!configured.warnings.some((issue) => issue.key === "UPLOAD_STORAGE"));
  assert.ok(configured.manualChecks.some((message) => message.includes("uploads:migrate")));
  assert.ok(hasError(check({ ...s3, UPLOAD_S3_ENDPOINT: "http://storage.fixture-retail.net" }), "UPLOAD_S3_ENDPOINT"));
  assert.deepEqual(check({ ...s3, UPLOAD_S3_ENDPOINT: "https://storage.fixture-retail.net/s3" }).errors, []);
});

test("the custom-domain CNAME target must be a public hostname", () => {
  assert.deepEqual(check({ STORE_DOMAIN_TARGET: "stores.fixture-retail.net" }).errors, []);
  for (const bad of ["https://stores.fixture-retail.net", "localhost", "stores.example.com", "not a host"]) {
    assert.ok(hasError(check({ STORE_DOMAIN_TARGET: bad }), "STORE_DOMAIN_TARGET"), bad);
  }
  assert.ok(check().manualChecks.some((message) => message.includes("deploy/caddy/Caddyfile")));
});
