import { NextRequest } from "next/server";
import {
	applyMembership,
	claimWebhookEvent,
	releaseWebhookEvent,
	syncStoreBilling,
	verifyWhopSignature,
} from "@/lib/backend/billing";
import { json } from "@/lib/backend/http";
import { getResellerSettings } from "@/lib/backend/resellers";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Whop webhooks. Membership events keep the seller's plan and store in
 * step with Whop: membership.activated when a trial or plan starts, and
 * membership.updated for every later change (renewal, past due, cancel,
 * expiry). Payment events need no action - their effect on access arrives
 * as a membership update. Whop retries non-2xx replies, so a failure here
 * releases the delivery id and answers 500 to get it again.
 */
export async function POST(request: NextRequest) {
	const body = await request.text();
	if (!verifyWhopSignature(request.headers, body)) {
		return json({ error: { code: "BAD_SIGNATURE", message: "Invalid signature." } }, { status: 401 });
	}

	let event: { data?: unknown; type?: string };
	try {
		event = JSON.parse(body);
	} catch {
		return json({ error: { code: "BAD_PAYLOAD", message: "Invalid JSON." } }, { status: 400 });
	}
	const deliveryId = request.headers.get("webhook-id") ?? "";
	const type = typeof event.type === "string" ? event.type : "unknown";
	if (!type.startsWith("membership.") || !event.data || typeof event.data !== "object") {
		return json({ received: true });
	}
	if (!(await claimWebhookEvent(deliveryId, type))) return json({ received: true, duplicate: true });

	try {
		const customerId = await applyMembership(event.data as Parameters<typeof applyMembership>[0]);
		if (customerId) {
			const settings = await getResellerSettings();
			await syncStoreBilling(customerId, settings.subscriptionsRequired);
		}
		return json({ received: true });
	} catch (error) {
		console.error("Whop webhook failed", type, error);
		await releaseWebhookEvent(deliveryId).catch(() => undefined);
		return json({ error: { code: "WEBHOOK_FAILED", message: "Try again." } }, { status: 500 });
	}
}
