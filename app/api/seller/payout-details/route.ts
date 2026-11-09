import { NextRequest } from "next/server";
import { requireCustomer } from "@/lib/backend/customer-auth";
import { handleApiError, json } from "@/lib/backend/http";
import { assertSameOrigin } from "@/lib/backend/request-guard";
import { maskPayoutDetails, updatePayoutDetails } from "@/lib/backend/resellers";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function PUT(request: NextRequest) {
	try {
		assertSameOrigin(request);
		const session = await requireCustomer(request);
		const details = await updatePayoutDetails(session.sub, await request.json().catch(() => ({})));
		return json({ data: maskPayoutDetails(details) });
	} catch (error) {
		return handleApiError(error);
	}
}
