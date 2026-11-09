import { NextRequest } from "next/server";
import { z } from "zod";
import { createCheckout } from "@/lib/backend/billing";
import { requireCustomer } from "@/lib/backend/customer-auth";
import { handleApiError, json, parseJson } from "@/lib/backend/http";
import { assertSameOrigin } from "@/lib/backend/request-guard";
import { PLAN_KEYS, type PlanKey } from "@/lib/billing/plans";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Starts a Whop checkout (free trial first) for the signed-in seller.
export async function POST(request: NextRequest) {
	try {
		assertSameOrigin(request);
		const session = await requireCustomer(request);
		const { plan } = await parseJson(request, z.object({ plan: z.enum(PLAN_KEYS as [PlanKey, ...PlanKey[]]) }));
		return json({ data: { url: await createCheckout(session.sub, plan) } });
	} catch (error) {
		return handleApiError(error);
	}
}
