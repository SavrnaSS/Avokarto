import { NextRequest } from "next/server";
import { requireCustomer } from "@/lib/backend/customer-auth";
import { handleApiError, json } from "@/lib/backend/http";
import { assertSameOrigin, consumeRateLimit, rateLimits } from "@/lib/backend/request-guard";
import { requireStoreForCustomer } from "@/lib/backend/resellers";
import { checkStoreDomain, withInstructions } from "@/lib/backend/store-domains";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Re-reads the domain's DNS records now and activates it when they're right.
export async function POST(request: NextRequest) {
	try {
		assertSameOrigin(request);
		const session = await requireCustomer(request);
		await consumeRateLimit(rateLimits.domainCheck, session.sub);
		const store = await requireStoreForCustomer(session.sub);
		return json({ data: withInstructions(await checkStoreDomain(store.id)) });
	} catch (error) {
		return handleApiError(error);
	}
}
