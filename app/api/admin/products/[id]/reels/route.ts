import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/backend/auth";
import { handleApiError, json } from "@/lib/backend/http";
import { addProductReel, listProductReels } from "@/lib/backend/product-reels";
import { assertSameOrigin, clientIp, consumeRateLimit, rateLimits } from "@/lib/backend/request-guard";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

// A product's promo reels (see lib/backend/product-reels.ts).
export async function GET(request: NextRequest, { params }: RouteContext) {
	try {
		await requireAdmin(request);
		const { id } = await params;
		return json({ data: await listProductReels(id) });
	} catch (error) {
		return handleApiError(error);
	}
}

// Upload a reel: multipart `file` (MP4), optional `poster`, `title`, `durationSeconds`.
export async function POST(request: NextRequest, { params }: RouteContext) {
	try {
		assertSameOrigin(request);
		await consumeRateLimit(rateLimits.upload, clientIp(request));
		await requireAdmin(request);
		const { id } = await params;
		return json({ data: await addProductReel(id, await request.formData()) }, { status: 201 });
	} catch (error) {
		return handleApiError(error);
	}
}
