import { NextRequest } from "next/server";
import { requireCustomer } from "@/lib/backend/customer-auth";
import { handleApiError, json } from "@/lib/backend/http";
import { storeUploadedImage } from "@/lib/backend/image-upload";
import { assertSameOrigin, consumeRateLimit, rateLimits } from "@/lib/backend/request-guard";
import { requireStoreForCustomer } from "@/lib/backend/resellers";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Store logo / banner uploads. Only sellers with a store can upload, at a
// modest rate, and images are capped smaller than catalog photos.
export async function POST(request: NextRequest) {
	try {
		assertSameOrigin(request);
		const session = await requireCustomer(request);
		await consumeRateLimit(rateLimits.sellerUpload, session.sub);
		await requireStoreForCustomer(session.sub);

		const formData = await request.formData();
		return json({ url: await storeUploadedImage(formData.get("file"), { maxBytes: 3 * 1024 * 1024 }) }, { status: 201 });
	} catch (error) {
		return handleApiError(error);
	}
}
