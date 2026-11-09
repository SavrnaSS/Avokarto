// Admin email alerts (lib/backend/admin-alerts.ts). The settings row and the
// email provider are simulated; sent mails are recorded.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import ts from "typescript";
import { z } from "zod";

const ROW = { alert_emails: "ops@example.com, owner@example.com", alert_new_order: true, alert_new_store: true, alert_new_ticket: false, alert_payout_request: true };
const ALERT = { lines: [["Order", "#AVO-1"], ["Total", "$10.00"]], link: "/admin/orders/AVO-1", subject: "New order #AVO-1", title: "New order to fulfil" };

function load({ row = ROW, configured = true, send } = {}) {
  const sent = [];
  const queries = [];
  const errors = [];
  const loadedModule = { exports: {} };
  const source = readFileSync(new URL("../lib/backend/admin-alerts.ts", import.meta.url), "utf8");
  const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } });
  const imports = {
    zod: { z },
    "@/lib/seo": { siteUrl: () => "https://avokarto.example" },
    "@/lib/backend/db": {
      dbQuery: async (sql, values) => {
        queries.push({ sql, values });
        return { rows: sql.includes("SELECT") ? [row] : [] };
      },
    },
    "@/lib/backend/email": {
      isEmailConfigured: () => configured,
      sendEmail: send ?? (async (message) => { sent.push(message); return { id: "x", status: "sent" }; }),
    },
  };
  runInNewContext(outputText, {
    module: loadedModule, exports: loadedModule.exports, console: { error: (...args) => errors.push(args.join(" ")) },
    require(name) { if (!(name in imports)) throw new Error(`Unmocked dependency ${name}`); return imports[name]; },
  });
  return { alerts: loadedModule.exports, errors, queries, sent };
}

test("an enabled event emails every recipient, linking into the admin", async () => {
  const { alerts, sent } = load();
  await alerts.notifyAdmins("newOrder", ALERT);
  assert.deepEqual(sent.map((mail) => mail.to).sort(), ["ops@example.com", "owner@example.com"]);
  assert.equal(sent[0].subject, "New order #AVO-1");
  assert.match(sent[0].text, /Total: \$10\.00/);
  assert.match(sent[0].html, /https:\/\/avokarto\.example\/admin\/orders\/AVO-1/);
});

test("a switched-off event sends nothing", async () => {
  const { alerts, sent } = load();
  await alerts.notifyAdmins("newTicket", ALERT);
  assert.equal(sent.length, 0);
});

test("no recipients means no email", async () => {
  const { alerts, sent } = load({ row: { ...ROW, alert_emails: "" } });
  await alerts.notifyAdmins("newOrder", ALERT);
  assert.equal(sent.length, 0);
});

test("a failing email provider never throws into the caller", async () => {
  const { alerts, errors } = load({ send: async () => { throw new Error("provider down"); } });
  await alerts.notifyAdmins("newOrder", ALERT);
  assert.ok(errors.some((line) => line.includes("provider down")));
});

test("alert text is escaped in the HTML email", async () => {
  const { alerts, sent } = load();
  await alerts.notifyAdmins("newOrder", { ...ALERT, lines: [["Customer", "<script>x</script>"]] });
  assert.ok(!sent[0].html.includes("<script>"));
  assert.match(sent[0].html, /&lt;script&gt;/);
});

test("saving cleans the recipient list and rejects bad addresses or more than 5", async () => {
  const { alerts, queries } = load();
  const events = { newOrder: true, newStore: false, newTicket: true, payoutRequest: true };
  await alerts.updateAdminAlertSettings({ events, recipients: " A@Example.com;b@example.com\nA@example.com " });
  const update = queries.find((query) => query.sql.includes("UPDATE store_settings"));
  assert.equal(update.values[0], "a@example.com, b@example.com");
  assert.equal(update.values[4], false);
  await assert.rejects(alerts.updateAdminAlertSettings({ events, recipients: "not-an-email" }));
  await assert.rejects(alerts.updateAdminAlertSettings({ events, recipients: "a@x.co,b@x.co,c@x.co,d@x.co,e@x.co,f@x.co" }));
});

test("the test button reports when email isn't configured instead of pretending", async () => {
  const { alerts, sent } = load({ configured: false });
  const result = await alerts.sendTestAlert();
  assert.equal(result.status, "not-configured");
  assert.equal(sent.length, 0);
});
