import { NextRequest } from "next/server";
import { requireCustomer } from "@/lib/backend/customer-auth";
import { handleApiError, json } from "@/lib/backend/http";
import { assertSameOrigin, consumeRateLimit, rateLimits } from "@/lib/backend/request-guard";
import { addSellerVideo, listSellerVideos } from "@/lib/backend/seller-videos";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// The signed-in seller's saved videos (made in Studio → Videos).
export async function GET(request: NextRequest) {
	try {
		const session = await requireCustomer(request);
		return json({ data: await listSellerVideos(session.sub) });
	} catch (error) {
		return handleApiError(error);
	}
}

// Save a video rendered in the seller's browser. Shares the seller upload
// rate limit with logo/banner uploads.
export async function POST(request: NextRequest) {
	try {
		assertSameOrigin(request);
		const session = await requireCustomer(request);
		await consumeRateLimit(rateLimits.sellerUpload, session.sub);
		return json({ data: await addSellerVideo(session.sub, await request.formData()) }, { status: 201 });
	} catch (error) {
		return handleApiError(error);
	}
}
