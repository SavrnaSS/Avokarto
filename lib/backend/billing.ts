import { createHmac, timingSafeEqual } from "node:crypto";
import { dbQuery } from "@/lib/backend/db";
import { HttpError } from "@/lib/backend/http";
import { ACCESS_STATUSES, grantsAccess, isPlanKey, PLANS, type PlanKey } from "@/lib/billing/plans";
import { siteUrl } from "@/lib/seo";

/* ------------------------------------------------------------------------
 * Seller subscriptions through Whop (https://docs.whop.com).
 *
 * Checkout: we create a Whop checkout configuration for the plan with the
 * seller's customer id in its metadata and send them to its purchase_url.
 * Whop copies that metadata onto the membership, so every membership
 * webhook tells us whose plan changed. Whop is the source of truth; this
 * module mirrors the membership into seller_subscriptions and opens or
 * closes the seller's store to match.
 * --------------------------------------------------------------------- */

const WHOP_API = (process.env.WHOP_API_BASE?.trim() || "https://api.whop.com/api/v1").replace(/\/+$/, "");

function whopPlanIds(): Record<PlanKey, string> {
	return {
		pro: process.env.WHOP_PLAN_PRO?.trim() ?? "",
		scale: process.env.WHOP_PLAN_SCALE?.trim() ?? "",
		starter: process.env.WHOP_PLAN_STARTER?.trim() ?? "",
	};
}

/** Whether checkout can run: an API key and a Whop plan for every plan we sell. */
export function billingConfigured() {
	return Boolean(process.env.WHOP_API_KEY?.trim() && Object.values(whopPlanIds()).every(Boolean));
}

function planForWhopPlan(whopPlanId: unknown): PlanKey | null {
	if (typeof whopPlanId !== "string" || !whopPlanId) return null;
	const plans = whopPlanIds();
	return (Object.keys(plans) as PlanKey[]).find((key) => plans[key] === whopPlanId) ?? null;
}

async function whopRequest<T>(method: "GET" | "POST", path: string, body?: unknown): Promise<T> {
	const key = process.env.WHOP_API_KEY?.trim();
	if (!key) throw new HttpError(503, "Billing isn't set up yet.", "BILLING_NOT_CONFIGURED");
	const response = await fetch(`${WHOP_API}${path}`, {
		body: body === undefined ? undefined : JSON.stringify(body),
		cache: "no-store",
		headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
		method,
		signal: AbortSignal.timeout(10_000),
	}).catch(() => {
		throw new HttpError(502, "Couldn't reach our payment partner. Please try again.", "PAYMENTS_UNREACHABLE");
	});
	const payload = (await response.json().catch(() => null)) as T | null;
	if (!response.ok || !payload) {
		console.error("Whop API error", method, path, response.status, payload);
		throw new HttpError(502, "Our payment partner didn't accept that. Please try again.", "PAYMENTS_ERROR");
	}
	return payload;
}

/* ------------------------------------------------------------------------
 * Subscriptions
 * --------------------------------------------------------------------- */

export type SellerSubscription = {
	cancelAtPeriodEnd: boolean;
	currentPeriodEnd: string | null;
	manageUrl: string;
	membershipId: string;
	plan: PlanKey;
	status: string;
};

type SubscriptionRow = {
	cancel_at_period_end: boolean;
	current_period_end: Date | null;
	manage_url: string;
	plan: PlanKey;
	status: string;
	whop_membership_id: string;
	whop_updated_at: Date | null;
};

const SUBSCRIPTION_COLUMNS = "plan, status, whop_membership_id, current_period_end, cancel_at_period_end, manage_url, whop_updated_at";

function toSubscription(row: SubscriptionRow): SellerSubscription {
	return {
		cancelAtPeriodEnd: row.cancel_at_period_end,
		currentPeriodEnd: row.current_period_end?.toISOString() ?? null,
		manageUrl: row.manage_url,
		membershipId: row.whop_membership_id,
		plan: row.plan,
		status: row.status,
	};
}

export async function getSubscription(customerId: string) {
	const result = await dbQuery<SubscriptionRow>(
		`SELECT ${SUBSCRIPTION_COLUMNS} FROM seller_subscriptions WHERE customer_id = $1`,
		[customerId],
	);
	return result.rows[0] ? toSubscription(result.rows[0]) : null;
}

/**
 * The plan whose limits apply to this seller, or null when they have no
 * plan that grants access. With subscriptions not required everyone gets
 * Pro's limits, as before billing existed.
 */
export async function effectivePlan(customerId: string, required: boolean): Promise<PlanKey | null> {
	if (!required) return "pro";
	const subscription = await getSubscription(customerId);
	return subscription && grantsAccess(subscription.status) ? subscription.plan : null;
}

/** Throws unless the seller's plan allows this many listings after adding one. */
export async function assertListingAllowed(customerId: string, required: boolean, otherListings: number) {
	const plan = await effectivePlan(customerId, required);
	if (!plan) {
		throw new HttpError(402, "Start your free trial to add products to your store.", "SUBSCRIPTION_REQUIRED");
	}
	const limit = PLANS[plan].listingLimit;
	if (limit !== null && otherListings >= limit) {
		throw new HttpError(
			402,
			`The ${PLANS[plan].name} plan includes up to ${limit} products. Upgrade to Pro for unlimited products.`,
			"PLAN_LIMIT",
		);
	}
}

/** Throws unless the seller's plan includes a custom domain. */
export async function assertCustomDomainAllowed(customerId: string, required: boolean) {
	const plan = await effectivePlan(customerId, required);
	if (!plan || !PLANS[plan].customDomain) {
		throw new HttpError(402, "Connecting your own domain is part of the Pro plan.", "PLAN_LIMIT");
	}
}

/**
 * Opens or closes stores to match billing. With subscriptions required, a
 * store without a plan that grants access goes 'unpaid' (hidden everywhere
 * an inactive store is); otherwise it's 'active'. Suspended stores are an
 * admin decision and are never touched. One customer, or every store when
 * customerId is null (after the admin flips the switch).
 */
export async function syncStoreBilling(customerId: string | null, required: boolean) {
	await dbQuery(
		`
			UPDATE reseller_stores s SET status = next.status, updated_at = now()
			FROM (
				SELECT rs.id,
					CASE WHEN $1::boolean AND NOT EXISTS (
						SELECT 1 FROM seller_subscriptions ss
						WHERE ss.customer_id = rs.customer_id AND ss.status = ANY($3::text[])
					) THEN 'unpaid' ELSE 'active' END AS status
				FROM reseller_stores rs
				WHERE rs.status IN ('active', 'unpaid') AND ($2::uuid IS NULL OR rs.customer_id = $2::uuid)
			) next
			WHERE s.id = next.id AND s.status <> next.status
		`,
		[required, customerId, [...ACCESS_STATUSES]],
	);
}

/* ------------------------------------------------------------------------
 * Checkout
 * --------------------------------------------------------------------- */

/** A Whop checkout link for this seller and plan. */
export async function createCheckout(customerId: string, plan: PlanKey) {
	const whopPlan = whopPlanIds()[plan];
	if (!billingConfigured() || !whopPlan) {
		throw new HttpError(503, "Billing isn't set up yet. Please try again soon.", "BILLING_NOT_CONFIGURED");
	}
	const current = await getSubscription(customerId);
	// A second checkout would start a second, separately billed membership.
	if (current && grantsAccess(current.status)) {
		throw new HttpError(409, "You already have a plan. Change or cancel it from Manage billing.", "ALREADY_SUBSCRIBED");
	}
	const accountId = process.env.WHOP_ACCOUNT_ID?.trim();
	const checkout = await whopRequest<{ purchase_url?: string }>("POST", "/checkout_configurations", {
		...(accountId ? { account_id: accountId } : {}),
		metadata: { customer_id: customerId, plan },
		redirect_url: `${siteUrl()}/seller?tab=billing&checkout=done`,
		variant_id: whopPlan,
	});
	if (!checkout.purchase_url) throw new HttpError(502, "Our payment partner didn't return a checkout link.", "PAYMENTS_ERROR");
	return checkout.purchase_url;
}

/**
 * Whop only includes manage_url when the API key may manage members; when
 * a webhook arrived without one, look it up once and keep it.
 */
export async function ensureManageUrl(customerId: string, subscription: SellerSubscription) {
	if (subscription.manageUrl || !process.env.WHOP_API_KEY?.trim()) return subscription;
	try {
		const membership = await whopRequest<{ manage_url?: string | null }>(
			"GET",
			`/memberships/${encodeURIComponent(subscription.membershipId)}`,
		);
		if (!membership.manage_url) return subscription;
		await dbQuery(`UPDATE seller_subscriptions SET manage_url = $2 WHERE customer_id = $1`, [customerId, membership.manage_url]);
		return { ...subscription, manageUrl: membership.manage_url };
	} catch {
		return subscription;
	}
}

/* ------------------------------------------------------------------------
 * Webhooks (Standard Webhooks signatures)
 * --------------------------------------------------------------------- */

const SIGNATURE_TOLERANCE_SECONDS = 5 * 60;

/**
 * Verifies a Whop delivery: HMAC-SHA256 over "id.timestamp.body", base64,
 * in the webhook-signature header as "v1,<sig>" (space-separated when
 * there are several). Whop's docs describe the key both as the secret
 * itself and as the Standard Webhooks base64 part after the prefix, so both
 * are accepted - each still requires knowing the secret.
 */
export function verifyWhopSignature(headers: Headers, body: string, now = Date.now()) {
	const secret = process.env.WHOP_WEBHOOK_SECRET?.trim();
	if (!secret) return false;
	const id = headers.get("webhook-id");
	const timestamp = headers.get("webhook-timestamp");
	const signatures = headers.get("webhook-signature");
	if (!id || !timestamp || !signatures || !/^\d+$/.test(timestamp)) return false;
	if (Math.abs(now / 1000 - Number(timestamp)) > SIGNATURE_TOLERANCE_SECONDS) return false;

	const keys = [Buffer.from(secret, "utf8")];
	const prefixed = /^(?:whsec_|ws_)(.+)$/.exec(secret);
	if (prefixed) {
		const decoded = Buffer.from(prefixed[1], "base64");
		if (decoded.length) keys.push(decoded);
	}
	const signed = `${id}.${timestamp}.${body}`;
	const expected = keys.map((key) => Buffer.from(createHmac("sha256", key).update(signed).digest("base64")));
	return signatures.split(" ").some((entry) => {
		const [version, signature] = entry.split(",");
		if (version !== "v1" || !signature) return false;
		const given = Buffer.from(signature);
		return expected.some((candidate) => candidate.length === given.length && timingSafeEqual(candidate, given));
	});
}

type WhopMembership = {
	cancel_at_period_end?: boolean | null;
	current_period_end?: string | number | null;
	id?: string;
	manage_url?: string | null;
	metadata?: Record<string, unknown> | null;
	plan?: { id?: string } | null;
	status?: string;
	updated_at?: string | number | null;
	variant_id?: string | null;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Whop timestamps are ISO strings; tolerate Unix seconds too.
function toDate(value: unknown) {
	if (typeof value === "number") return new Date(value * 1000);
	if (typeof value === "string" && value) {
		const date = new Date(/^\d+$/.test(value) ? Number(value) * 1000 : value);
		return Number.isNaN(date.getTime()) ? null : date;
	}
	return null;
}

/** Records a delivery id; false when it was already handled. */
export async function claimWebhookEvent(id: string, type: string) {
	const result = await dbQuery(
		`INSERT INTO whop_webhook_events (id, type) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING`,
		[id, type],
	);
	return Boolean(result.rowCount);
}

export async function releaseWebhookEvent(id: string) {
	await dbQuery(`DELETE FROM whop_webhook_events WHERE id = $1`, [id]);
}

/**
 * Applies a membership.* webhook. Returns the customer it changed, or null
 * when the membership isn't one of ours or the update was stale.
 */
export async function applyMembership(membership: WhopMembership): Promise<string | null> {
	const membershipId = membership.id;
	const status = membership.status;
	if (!membershipId || !status) return null;

	const metadata = membership.metadata ?? {};
	const existing = await dbQuery<SubscriptionRow & { customer_id: string }>(
		`SELECT customer_id, ${SUBSCRIPTION_COLUMNS} FROM seller_subscriptions WHERE whop_membership_id = $1`,
		[membershipId],
	);
	const customerId = typeof metadata.customer_id === "string" && UUID.test(metadata.customer_id)
		? metadata.customer_id
		: existing.rows[0]?.customer_id;
	if (!customerId) return null;

	const plan = planForWhopPlan(membership.variant_id ?? membership.plan?.id)
		?? (isPlanKey(metadata.plan) ? metadata.plan : null)
		?? existing.rows[0]?.plan;
	if (!plan) return null;

	const current = await getSubscription(customerId);
	// A different, older membership (e.g. the one they cancelled before
	// re-subscribing) must not replace a plan that still grants access.
	if (current && current.membershipId !== membershipId && grantsAccess(current.status) && !grantsAccess(status)) {
		return null;
	}

	const whopUpdatedAt = toDate(membership.updated_at);
	const result = await dbQuery(
		`
			INSERT INTO seller_subscriptions (
				customer_id, plan, whop_membership_id, status, current_period_end,
				cancel_at_period_end, manage_url, whop_updated_at
			)
			VALUES ($1, $2, $3, $4, $5, $6, COALESCE($7, ''), $8)
			ON CONFLICT (customer_id) DO UPDATE SET
				plan = EXCLUDED.plan,
				whop_membership_id = EXCLUDED.whop_membership_id,
				status = EXCLUDED.status,
				current_period_end = EXCLUDED.current_period_end,
				cancel_at_period_end = EXCLUDED.cancel_at_period_end,
				manage_url = COALESCE(NULLIF(EXCLUDED.manage_url, ''), seller_subscriptions.manage_url),
				whop_updated_at = EXCLUDED.whop_updated_at,
				updated_at = now()
			WHERE seller_subscriptions.whop_membership_id <> EXCLUDED.whop_membership_id
				OR seller_subscriptions.whop_updated_at IS NULL
				OR EXCLUDED.whop_updated_at IS NULL
				OR EXCLUDED.whop_updated_at >= seller_subscriptions.whop_updated_at
		`,
		[
			customerId,
			plan,
			membershipId,
			status,
			toDate(membership.current_period_end),
			membership.cancel_at_period_end === true,
			membership.manage_url ?? null,
			whopUpdatedAt,
		],
	);
	return result.rowCount ? customerId : null;
}
