import { after, NextRequest } from "next/server";
import { notifyAdmins } from "@/lib/backend/admin-alerts";
import { requireCustomer } from "@/lib/backend/customer-auth";
import { handleApiError, json } from "@/lib/backend/http";
import { assertSameOrigin, consumeRateLimit, rateLimits } from "@/lib/backend/request-guard";
import { getStoreForCustomer, listSellerPayouts, requestPayout } from "@/lib/backend/resellers";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
	try {
		const session = await requireCustomer(request);
		return json({ data: await listSellerPayouts(session.sub) });
	} catch (error) {
		return handleApiError(error);
	}
}

export async function POST(request: NextRequest) {
	try {
		assertSameOrigin(request);
		const session = await requireCustomer(request);
		await consumeRateLimit(rateLimits.payoutRequest, session.sub);
		const payout = await requestPayout(session.sub, await request.json().catch(() => ({})));
		after(async () => {
			const store = await getStoreForCustomer(session.sub).catch(() => null);
			const amount = new Intl.NumberFormat("en-US", { currency: "USD", style: "currency" }).format(payout.amount);
			await notifyAdmins("payoutRequest", {
				lines: [["Store", store ? `${store.name} (/${store.handle})` : "-"], ["Amount", amount]],
				link: "/admin/resellers/payouts",
				subject: `Payout request: ${amount}${store ? ` from ${store.name}` : ""}`,
				title: "A seller asked to be paid",
			});
		});
		return json({ data: payout }, { status: 201 });
	} catch (error) {
		return handleApiError(error);
	}
}
