import { NextRequest } from "next/server";
import { z } from "zod";
import { handleApiError } from "@/lib/backend/http";
import { assertSameOrigin, clientIp, consumeRateLimit, rateLimits } from "@/lib/backend/request-guard";
import { isBot, recordStoreEvent } from "@/lib/backend/store-insights";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const eventSchema = z.object({
	event: z.string().max(32),
	handle: z.string().max(60),
	productSlug: z.string().max(200).optional(),
	source: z.string().max(32),
	visitorId: z.string().max(64),
});

// Storefront analytics beacon (navigator.sendBeacon, text/plain JSON).
// Always answers 204 so tracking can never break or slow the store.
export async function POST(request: NextRequest) {
	try {
		assertSameOrigin(request);
		if (isBot(request.headers.get("user-agent"))) return new Response(null, { status: 204 });
		await consumeRateLimit(rateLimits.storeEvents, clientIp(request));
		const body = eventSchema.parse(JSON.parse(await request.text()));
		await recordStoreEvent(body);
		return new Response(null, { status: 204 });
	} catch (error) {
		// Rejections are logged like any API error but stay invisible to shoppers.
		const response = handleApiError(error);
		return response.status >= 500 ? response : new Response(null, { status: 204 });
	}
}
