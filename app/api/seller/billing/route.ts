import { NextRequest } from "next/server";
import { billingConfigured, ensureManageUrl, getSubscription } from "@/lib/backend/billing";
import { requireCustomer } from "@/lib/backend/customer-auth";
import { dbQuery } from "@/lib/backend/db";
import { handleApiError, json } from "@/lib/backend/http";
import { getResellerSettings } from "@/lib/backend/resellers";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// The seller's plan as Whop last reported it, plus what the billing screen needs.
export async function GET(request: NextRequest) {
	try {
		const session = await requireCustomer(request);
		const [settings, subscription, listings] = await Promise.all([
			getResellerSettings(),
			getSubscription(session.sub),
			dbQuery<{ total: number }>(
				`SELECT count(*)::int AS total FROM reseller_listings l JOIN reseller_stores s ON s.id = l.store_id WHERE s.customer_id = $1`,
				[session.sub],
			),
		]);
		return json({
			data: {
				configured: billingConfigured(),
				listings: listings.rows[0]?.total ?? 0,
				required: settings.subscriptionsRequired,
				subscription: subscription ? await ensureManageUrl(session.sub, subscription) : null,
			},
		});
	} catch (error) {
		return handleApiError(error);
	}
}
