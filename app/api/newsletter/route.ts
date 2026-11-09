import { NextRequest } from "next/server";
import { handleApiError, json } from "@/lib/backend/http";
import { subscribeToNewsletter } from "@/lib/backend/newsletter";
import { assertSameOrigin, clientIp, consumeRateLimit, rateLimits } from "@/lib/backend/request-guard";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Footer newsletter sign-up.
export async function POST(request: NextRequest) {
	try {
		assertSameOrigin(request);
		await consumeRateLimit(rateLimits.newsletter, clientIp(request));
		await subscribeToNewsletter(await request.json().catch(() => ({})));
		return json({ ok: true }, { status: 201 });
	} catch (error) {
		return handleApiError(error);
	}
}
