import { z } from "zod";
import { dbQuery } from "@/lib/backend/db";
import { isEmailConfigured, sendEmail } from "@/lib/backend/email";
import { siteUrl } from "@/lib/seo";

/* ------------------------------------------------------------------------
 * Admin email alerts. Admin -> Settings -> Notifications picks who gets
 * them and which events send one; the events call notifyAdmins() from an
 * after() callback, so a slow or failing email provider never touches the
 * customer's or seller's request. Best-effort: never throws.
 * --------------------------------------------------------------------- */

export const ADMIN_ALERT_EVENTS = ["newOrder", "payoutRequest", "newTicket", "newStore"] as const;
export type AdminAlertEvent = (typeof ADMIN_ALERT_EVENTS)[number];

export type AdminAlertSettings = {
	emailConfigured: boolean;
	events: Record<AdminAlertEvent, boolean>;
	recipients: string[];
};

const MAX_RECIPIENTS = 5;

type SettingsRow = {
	alert_emails: string;
	alert_new_order: boolean;
	alert_new_store: boolean;
	alert_new_ticket: boolean;
	alert_payout_request: boolean;
};

const parseRecipients = (value: string) =>
	[...new Set(value.split(/[\s,;]+/).map((email) => email.trim().toLowerCase()).filter(Boolean))];

export async function getAdminAlertSettings(): Promise<AdminAlertSettings> {
	const result = await dbQuery<SettingsRow>(
		"SELECT alert_emails, alert_new_order, alert_payout_request, alert_new_ticket, alert_new_store FROM store_settings WHERE id = 1",
	);
	const row = result.rows[0];
	return {
		emailConfigured: isEmailConfigured(),
		events: {
			newOrder: row?.alert_new_order ?? true,
			newStore: row?.alert_new_store ?? true,
			newTicket: row?.alert_new_ticket ?? true,
			payoutRequest: row?.alert_payout_request ?? true,
		},
		recipients: parseRecipients(row?.alert_emails ?? ""),
	};
}

const settingsSchema = z.object({
	events: z.object({
		newOrder: z.boolean(),
		newStore: z.boolean(),
		newTicket: z.boolean(),
		payoutRequest: z.boolean(),
	}),
	recipients: z
		.array(z.email("Enter valid email addresses."))
		.max(MAX_RECIPIENTS, `Up to ${MAX_RECIPIENTS} addresses.`),
});

export async function updateAdminAlertSettings(body: unknown) {
	const raw = body as { recipients?: unknown };
	const input = settingsSchema.parse({
		...(body as object),
		recipients: typeof raw?.recipients === "string" ? parseRecipients(raw.recipients) : raw?.recipients,
	});
	await dbQuery(
		`
			UPDATE store_settings
			SET alert_emails = $1, alert_new_order = $2, alert_payout_request = $3, alert_new_ticket = $4, alert_new_store = $5
			WHERE id = 1
		`,
		[input.recipients.join(", "), input.events.newOrder, input.events.payoutRequest, input.events.newTicket, input.events.newStore],
	);
	return getAdminAlertSettings();
}

const escapeHtml = (value: string) =>
	value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char] ?? char);

type Alert = {
	/** Admin path the email links to, e.g. "/admin/orders". */
	link: string;
	/** Short facts, shown as "Label: value" lines. */
	lines: [string, string][];
	subject: string;
	title: string;
};

function buildAlertEmail(alert: Alert) {
	const url = `${siteUrl()}${alert.link}`;
	const text = [alert.title, "", ...alert.lines.map(([label, value]) => `${label}: ${value}`), "", `Open in admin: ${url}`].join("\n");
	const rows = alert.lines
		.map(
			([label, value]) =>
				`<tr><td style="padding:6px 0;color:#6b7280;font-size:14px">${escapeHtml(label)}</td><td style="padding:6px 0;text-align:right;font-size:14px;font-weight:600;color:#111827">${escapeHtml(value)}</td></tr>`,
		)
		.join("");
	const html = `<!doctype html><html lang="en"><body style="margin:0;background:#f4f7ef;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:28px 16px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:460px;background:#fff;border-radius:16px;padding:24px">
<tr><td><p style="margin:0 0 4px;font-size:12px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#4f9a2c">Avokarto admin</p>
<h1 style="margin:0 0 16px;font-size:20px;color:#13200d">${escapeHtml(alert.title)}</h1>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}</table>
<p style="margin:20px 0 0"><a href="${escapeHtml(url)}" style="display:inline-block;background:#174d0a;color:#fff;text-decoration:none;padding:10px 16px;border-radius:10px;font-size:14px;font-weight:600">Open in admin</a></p>
<p style="margin:18px 0 0;font-size:12px;color:#9ca3af">Change these alerts in Admin &rarr; Settings &rarr; Notifications.</p>
</td></tr></table></td></tr></table></body></html>`;
	return { html, subject: alert.subject, text };
}

/** Sends `alert` to every recipient if `event` is switched on. */
export async function notifyAdmins(event: AdminAlertEvent, alert: Alert) {
	try {
		const settings = await getAdminAlertSettings();
		if (!settings.events[event] || !settings.recipients.length) return;
		const message = buildAlertEmail(alert);
		await Promise.all(settings.recipients.map((to) => sendEmail({ ...message, to })));
	} catch (error) {
		console.error("Admin alert failed", event, error instanceof Error ? error.message : error);
	}
}

/** The "Send test email" button: reports per address what happened. */
export async function sendTestAlert() {
	const settings = await getAdminAlertSettings();
	if (!settings.recipients.length) return { results: [], status: "no-recipients" as const };
	if (!settings.emailConfigured) return { results: [], status: "not-configured" as const };
	const message = buildAlertEmail({
		lines: [["Sent", new Date().toUTCString()]],
		link: "/admin/notifications",
		subject: "Test alert from Avokarto admin",
		title: "Your admin alerts are working",
	});
	const results = await Promise.all(
		settings.recipients.map(async (to) => ({ result: await sendEmail({ ...message, to }), to })),
	);
	return {
		results: results.map(({ result, to }) => ({ ok: result.status === "sent", to })),
		status: "sent" as const,
	};
}
