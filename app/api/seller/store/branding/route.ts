import { NextRequest } from "next/server";
import { requireCustomer } from "@/lib/backend/customer-auth";
import { handleApiError, json } from "@/lib/backend/http";
import { assertSameOrigin } from "@/lib/backend/request-guard";
import { maskPayoutDetails, updateStoreBranding } from "@/lib/backend/resellers";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Logo, banner, theme, about, announcement and contact links.
export async function PATCH(request: NextRequest) {
	try {
		assertSameOrigin(request);
		const session = await requireCustomer(request);
		const store = await updateStoreBranding(session.sub, await request.json().catch(() => ({})));
		return json({ data: { ...store, payoutDetails: maskPayoutDetails(store.payoutDetails) } });
	} catch (error) {
		return handleApiError(error);
	}
}
