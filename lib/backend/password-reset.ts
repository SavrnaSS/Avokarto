import { createHmac, randomInt, timingSafeEqual } from "node:crypto";
import bcrypt from "bcryptjs";
import type { CustomerSession } from "@/lib/backend/customer-auth";
import { dbQuery, withTransaction } from "@/lib/backend/db";
import { isEmailConfigured, sendEmail } from "@/lib/backend/email";
import { HttpError } from "@/lib/backend/http";

/* ------------------------------------------------------------------------
 * Password reset by emailed one-time code.
 *
 * Request: a 6-digit code is emailed to the account; only an HMAC of it is
 * stored (keyed with JWT_SECRET and bound to the customer), it expires in
 * 15 minutes and a new request replaces it. The reply never says whether
 * the email has an account. Confirm: 5 guesses per code, then a new code is
 * needed; success sets the password, clears the code and signs the
 * customer in. Proving the inbox is proof enough to claim a guest row or
 * reactivate a self-deleted account; admin-held ("review") accounts are
 * never reset.
 * --------------------------------------------------------------------- */

export const RESET_CODE_TTL_MINUTES = 15;
export const RESET_CODE_MAX_ATTEMPTS = 5;
const SITE_NAME = "Avokarto";

type ResetCustomer = { email: string; id: string; name: string; status: string };

function codeKey() {
	const secret = process.env.JWT_SECRET?.trim();
	if (!secret || secret.length < 32) {
		throw new HttpError(503, "Password reset isn't configured.", "AUTH_NOT_CONFIGURED");
	}
	return secret;
}

export function hashResetCode(customerId: string, code: string) {
	return createHmac("sha256", codeKey()).update(`${customerId}:${code}`).digest("base64url");
}

function sameHash(a: string, b: string) {
	const left = Buffer.from(a);
	const right = Buffer.from(b);
	return left.length === right.length && timingSafeEqual(left, right);
}

async function findResettable(email: string): Promise<ResetCustomer | null> {
	const result = await dbQuery<ResetCustomer>(
		"SELECT id, email, name, status FROM customers WHERE lower(email) = lower($1) LIMIT 1",
		[email.trim()],
	);
	const customer = result.rows[0];
	return customer && customer.status !== "review" ? customer : null;
}

function escapeHtml(value: string) {
	return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char] ?? char);
}

export function buildResetEmail(name: string, code: string) {
	const greeting = name.trim() ? `Hi ${name.trim().split(/\s+/)[0]},` : "Hi,";
	const text = [
		greeting,
		"",
		`Your ${SITE_NAME} password reset code is: ${code}`,
		"",
		`It expires in ${RESET_CODE_TTL_MINUTES} minutes. If you didn't ask to reset your password, you can ignore this email - your password won't change.`,
	].join("\n");
	const html = `<!doctype html>
<html lang="en"><body style="margin:0;background:#f4f7ef;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;color:#13200d">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:440px;background:#ffffff;border-radius:20px;padding:32px 28px;text-align:center">
<tr><td>
<p style="margin:0 0 6px;font-size:13px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#4f9a2c">${SITE_NAME} account recovery</p>
<h1 style="margin:0 0 12px;font-size:24px;line-height:1.2">Reset your password</h1>
<p style="margin:0 0 22px;font-size:15px;line-height:1.5;color:#5f6f53">${escapeHtml(greeting)} enter this code to choose a new password.</p>
<p style="margin:0 0 22px;padding:16px 0;border-radius:14px;background:#eef8dc;font-size:32px;font-weight:800;letter-spacing:.3em;color:#173c2a">${code}</p>
<p style="margin:0;font-size:13px;line-height:1.5;color:#8a9a7e">It expires in ${RESET_CODE_TTL_MINUTES} minutes. If you didn't ask for this, ignore this email - your password won't change.</p>
</td></tr></table></td></tr></table></body></html>`;
	return { html, subject: `${code} is your ${SITE_NAME} reset code`, text };
}

/**
 * Starts a reset. Resolves the same way whether or not the email has an
 * account, so the response can't be used to discover who's registered.
 */
export async function requestPasswordReset(email: string) {
	const customer = await findResettable(email);
	if (!customer) return;

	const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
	await dbQuery(
		`
			INSERT INTO password_reset_codes (customer_id, code_hash, attempts, expires_at, created_at)
			VALUES ($1, $2, 0, now() + make_interval(mins => $3), now())
			ON CONFLICT (customer_id) DO UPDATE SET
				code_hash = EXCLUDED.code_hash, attempts = 0, expires_at = EXCLUDED.expires_at, created_at = now()
		`,
		[customer.id, hashResetCode(customer.id, code), RESET_CODE_TTL_MINUTES],
	);

	if (!isEmailConfigured()) {
		if (process.env.NODE_ENV === "production") {
			console.error("Password reset requested but email isn't configured (RESEND_API_KEY, EMAIL_FROM) - no code was sent.");
		} else {
			// Development only: lets the flow be tested without an email provider.
			console.info(`[dev] Password reset code for ${customer.email}: ${code}`);
		}
		return;
	}
	const message = buildResetEmail(customer.name, code);
	const result = await sendEmail({ ...message, to: customer.email });
	if (result.status === "failed") console.error("Password reset email failed", result.error);
}

/** Checks the code and sets the new password; returns the session to sign in with. */
export async function confirmPasswordReset(email: string, code: string, newPassword: string): Promise<CustomerSession> {
	const invalid = () => new HttpError(400, "That code isn't right or has expired. Check it, or send a new one.", "INVALID_RESET_CODE");
	const customer = await findResettable(email);
	if (!customer || !/^\d{6}$/.test(code)) throw invalid();

	// The transaction returns an outcome instead of throwing, so a wrong
	// guess's attempt count is committed - a throw would roll it back.
	const outcome = await withTransaction(async (client) => {
		// Locked so two guesses can't race past the attempt limit.
		const row = (await client.query<{ attempts: number; code_hash: string; expired: boolean }>(
			`SELECT code_hash, attempts, expires_at <= now() AS expired FROM password_reset_codes WHERE customer_id = $1 FOR UPDATE`,
			[customer.id],
		)).rows[0];
		if (!row || row.expired) return "invalid" as const;
		if (row.attempts >= RESET_CODE_MAX_ATTEMPTS) return "locked" as const;
		if (!sameHash(row.code_hash, hashResetCode(customer.id, code))) {
			await client.query(`UPDATE password_reset_codes SET attempts = attempts + 1 WHERE customer_id = $1`, [customer.id]);
			return "invalid" as const;
		}
		// Hashed only once the code matches, so wrong guesses cost no bcrypt work.
		const passwordHash = await bcrypt.hash(newPassword, 12);
		await client.query(
			`UPDATE customers SET password_hash = $2, status = CASE WHEN status = 'deleted' THEN 'active' ELSE status END WHERE id = $1`,
			[customer.id, passwordHash],
		);
		await client.query(`DELETE FROM password_reset_codes WHERE customer_id = $1`, [customer.id]);
		return "reset" as const;
	});

	if (outcome === "locked") throw new HttpError(429, "Too many wrong codes. Send yourself a new one.", "RESET_CODE_LOCKED");
	if (outcome !== "reset") throw invalid();
	return { email: customer.email, name: customer.name, sub: customer.id };
}
