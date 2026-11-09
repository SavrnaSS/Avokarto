import { createHash } from "node:crypto";
import { dbQuery } from "@/lib/backend/db";
import { HttpError } from "@/lib/backend/http";

/**
 * Reject state-changing requests sent by another site. SameSite=Lax cookies
 * already stop most cross-site writes; this is the explicit second layer.
 * Browsers always send Origin on cross-origin POST/PATCH/DELETE, so a
 * missing header (server-to-server calls, curl) is allowed through.
 */
export function assertSameOrigin(request: Request) {
	const origin = request.headers.get("origin");
	if (!origin) return;

	let originHost: string;
	try {
		originHost = new URL(origin).host;
	} catch {
		throw new HttpError(403, "Request origin not allowed.", "FORBIDDEN_ORIGIN");
	}

	const allowed = new Set<string>();
	// Behind a reverse proxy the public host arrives in X-Forwarded-Host.
	for (const header of ["x-forwarded-host", "host"]) {
		const value = request.headers.get(header)?.split(",")[0]?.trim();
		if (value) allowed.add(value);
	}
	try {
		allowed.add(new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "").host);
	} catch {
		// Not configured (local development) - the Host headers suffice.
	}

	if (!allowed.has(originHost)) {
		throw new HttpError(403, "Request origin not allowed.", "FORBIDDEN_ORIGIN");
	}
}

/**
 * The client's IP for rate limiting. Production runs behind a reverse proxy
 * that sets X-Forwarded-For; its first entry is the original client.
 */
export function clientIp(request: Request) {
	return (
		request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
		request.headers.get("x-real-ip")?.trim() ||
		"unknown"
	);
}

export type RateLimitRule = {
	/** Maximum hits per window. */
	limit: number;
	/** Short name for the protected action, e.g. "admin-login". */
	scope: string;
	windowSeconds: number;
};

// Keys are hashed so raw IPs and email addresses aren't stored.
function bucketKey(scope: string, subject: string) {
	return `${scope}:${createHash("sha256").update(subject.toLowerCase()).digest("base64url").slice(0, 32)}`;
}

function tooManyRequests(retryAfterSeconds: number): HttpError {
	const minutes = Math.max(1, Math.ceil(retryAfterSeconds / 60));
	return new HttpError(
		429,
		`Too many attempts. Please wait ${minutes} minute${minutes === 1 ? "" : "s"} and try again.`,
		"RATE_LIMITED",
		{ retryAfterSeconds },
		{ "Retry-After": String(Math.max(1, Math.ceil(retryAfterSeconds))) },
	);
}

/** Count one hit against `subject`; throws 429 once the window's limit is exceeded. */
export async function consumeRateLimit(rule: RateLimitRule, subject: string) {
	const result = await dbQuery<{ hits: number; retry_after: string }>(
		`
			INSERT INTO rate_limit_buckets AS b (key, window_start, hits)
			VALUES ($1, now(), 1)
			ON CONFLICT (key) DO UPDATE SET
				hits = CASE WHEN b.window_start <= now() - make_interval(secs => $2) THEN 1 ELSE b.hits + 1 END,
				window_start = CASE WHEN b.window_start <= now() - make_interval(secs => $2) THEN now() ELSE b.window_start END
			RETURNING hits,
				extract(epoch from (window_start + make_interval(secs => $2) - now()))::text AS retry_after
		`,
		[bucketKey(rule.scope, subject), rule.windowSeconds],
	);
	const row = result.rows[0];

	// Opportunistic cleanup keeps the table small without a cron job.
	if (Math.random() < 0.01) {
		void dbQuery(
			`DELETE FROM rate_limit_buckets WHERE window_start < now() - interval '1 day'`,
		).catch(() => undefined);
	}

	if (row.hits > rule.limit) throw tooManyRequests(Number(row.retry_after));
}

/** Throw 429 if `subject` is already over its limit, without counting a hit. */
export async function assertRateLimit(rule: RateLimitRule, subject: string) {
	const result = await dbQuery<{ hits: number; retry_after: string }>(
		`
			SELECT hits,
				extract(epoch from (window_start + make_interval(secs => $2) - now()))::text AS retry_after
			FROM rate_limit_buckets
			WHERE key = $1 AND window_start > now() - make_interval(secs => $2)
		`,
		[bucketKey(rule.scope, subject), rule.windowSeconds],
	);
	const row = result.rows[0];
	if (row && row.hits >= rule.limit) throw tooManyRequests(Number(row.retry_after));
}

export const rateLimits = {
	// Per client IP, every attempt.
	loginByIp: { limit: 20, scope: "login-ip", windowSeconds: 15 * 60 },
	// Per account, failed attempts only - slows password guessing spread
	// across many IPs while a correct password still gets straight in.
	loginFailuresByEmail: { limit: 8, scope: "login-fail", windowSeconds: 15 * 60 },
	signup: { limit: 5, scope: "signup", windowSeconds: 60 * 60 },
	passwordChange: { limit: 10, scope: "password", windowSeconds: 15 * 60 },
	// Reset codes: requests per IP and per email (stops inbox flooding), guesses per IP.
	passwordResetRequestByIp: { limit: 10, scope: "reset-req-ip", windowSeconds: 15 * 60 },
	passwordResetRequestByEmail: { limit: 3, scope: "reset-req-email", windowSeconds: 15 * 60 },
	passwordResetConfirm: { limit: 20, scope: "reset-confirm", windowSeconds: 15 * 60 },
	// Store-link checks before sign-up (/start lets you build first, register later).
	storeHandleCheck: { limit: 120, scope: "handle-check", windowSeconds: 10 * 60 },
	contact: { limit: 5, scope: "contact", windowSeconds: 10 * 60 },
	newsletter: { limit: 5, scope: "newsletter", windowSeconds: 10 * 60 },
	// "Send test email" on the admin notifications page, per admin.
	adminTestAlert: { limit: 5, scope: "admin-test-alert", windowSeconds: 10 * 60 },
	checkout: { limit: 10, scope: "checkout", windowSeconds: 10 * 60 },
	review: { limit: 10, scope: "review", windowSeconds: 60 * 60 },
	upload: { limit: 120, scope: "upload", windowSeconds: 10 * 60 },
	payoutRequest: { limit: 5, scope: "payout", windowSeconds: 60 * 60 },
	sellerUpload: { limit: 30, scope: "seller-upload", windowSeconds: 60 * 60 },
	domainCheck: { limit: 30, scope: "domain-check", windowSeconds: 60 * 60 },
	// Following/unfollowing sellers, per customer.
	sellerFollow: { limit: 120, scope: "seller-follow", windowSeconds: 60 * 60 },
	// Storefront analytics beacons, per visitor IP.
	storeEvents: { limit: 600, scope: "store-events", windowSeconds: 10 * 60 },
} satisfies Record<string, RateLimitRule>;

/**
 * Wrap a credential check: blocked accounts fail fast, and only a failed
 * check counts toward that account's limit.
 */
export async function guardLogin<T>(
	request: Request,
	kind: "admin" | "customer",
	email: string,
	authorize: () => Promise<T>,
) {
	const account = `${kind}:${email.trim()}`;
	await consumeRateLimit(rateLimits.loginByIp, `${kind}:${clientIp(request)}`);
	await assertRateLimit(rateLimits.loginFailuresByEmail, account);

	try {
		return await authorize();
	} catch (error) {
		if (error instanceof HttpError && (error.status === 401 || error.status === 403)) {
			await consumeRateLimit(rateLimits.loginFailuresByEmail, account).catch((limitError) => {
				// The failure that crosses the limit still reports as bad credentials.
				if (!(limitError instanceof HttpError)) throw limitError;
			});
		}
		throw error;
	}
}
