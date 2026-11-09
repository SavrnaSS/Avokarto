// Server-only (lib/backend): reads RESEND_API_KEY, never import from client code.

/**
 * Transactional email via Resend's HTTPS API (https://resend.com/docs/api-reference/emails/send-email).
 * No SDK dependency - a single fetch.
 *
 * Configuration (.env):
 *   RESEND_API_KEY  - required to send; when unset, emails are skipped (logged once)
 *   EMAIL_FROM      - sender, e.g. "Avokarto <orders@avokarto.com>" (domain must be verified in Resend)
 *   EMAIL_REPLY_TO  - optional reply-to address (e.g. your support inbox)
 *
 * Callers should treat email as best-effort: this never throws.
 */

const RESEND_ENDPOINT = "https://api.resend.com/emails";
const REQUEST_TIMEOUT_MS = 10_000;

export type EmailMessage = {
  to: string;
  subject: string;
  html: string;
  text: string;
  // Makes retries of the same logical email safe (Resend de-duplicates).
  idempotencyKey?: string;
  // Display name to show instead of EMAIL_FROM's (e.g. a reseller store's).
  // The sending address itself always stays EMAIL_FROM's verified one.
  fromName?: string;
};

/** EMAIL_FROM ("Name <addr>" or "addr") with its display name swapped for `name`. */
function withDisplayName(from: string, name?: string) {
  const clean = name?.replace(/[<>"\r\n]/g, "").trim();
  if (!clean) return from;
  const address = /<([^>]+)>\s*$/.exec(from)?.[1] ?? from;
  return `"${clean}" <${address.trim()}>`;
}

export type EmailResult =
  | { status: "sent"; id: string }
  | { status: "skipped"; reason: string }
  | { status: "failed"; error: string };

let warnedNotConfigured = false;

export function isEmailConfigured() {
  return Boolean(process.env.RESEND_API_KEY?.trim() && process.env.EMAIL_FROM?.trim());
}

export async function sendEmail(message: EmailMessage): Promise<EmailResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.EMAIL_FROM?.trim();

  if (!apiKey || !from) {
    if (!warnedNotConfigured) {
      warnedNotConfigured = true;
      console.warn(
        "Email not configured (set RESEND_API_KEY and EMAIL_FROM) - transactional emails are being skipped.",
      );
    }
    return { status: "skipped", reason: "not-configured" };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        ...(message.idempotencyKey ? { "Idempotency-Key": message.idempotencyKey } : {}),
      },
      body: JSON.stringify({
        from: withDisplayName(from, message.fromName),
        to: [message.to],
        subject: message.subject,
        html: message.html,
        text: message.text,
        ...(process.env.EMAIL_REPLY_TO?.trim()
          ? { reply_to: process.env.EMAIL_REPLY_TO.trim() }
          : {}),
      }),
      signal: controller.signal,
      cache: "no-store",
    });
    const payload = (await response.json().catch(() => null)) as
      | { id?: string; message?: string; name?: string }
      | null;

    if (!response.ok || !payload?.id) {
      const error = payload?.message ?? `Resend responded with ${response.status}`;
      console.error(`Email "${message.subject}" to ${maskEmail(message.to)} failed: ${error}`);
      return { status: "failed", error };
    }
    return { status: "sent", id: payload.id };
  } catch (error) {
    const reason = controller.signal.aborted
      ? "timed out"
      : error instanceof Error
        ? error.message
        : "unknown error";
    console.error(`Email "${message.subject}" to ${maskEmail(message.to)} failed: ${reason}`);
    return { status: "failed", error: reason };
  } finally {
    clearTimeout(timer);
  }
}

/** j***@example.com - keeps customer addresses out of full server logs. */
function maskEmail(address: string) {
  const [user, domain] = address.split("@");
  if (!domain) return "***";
  return `${user.slice(0, 1)}***@${domain}`;
}
