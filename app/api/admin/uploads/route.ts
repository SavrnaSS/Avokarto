import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/backend/auth";
import { handleApiError, json } from "@/lib/backend/http";
import { storeUploadedImage } from "@/lib/backend/image-upload";
import { assertSameOrigin, clientIp, consumeRateLimit, rateLimits } from "@/lib/backend/request-guard";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
	try {
		assertSameOrigin(request);
		await consumeRateLimit(rateLimits.upload, clientIp(request));
		await requireAdmin(request);

		const formData = await request.formData();
		// Served via /api/uploads/[filename] whichever storage driver is
		// configured - see lib/backend/upload-storage.ts.
		return json({ url: await storeUploadedImage(formData.get("file")) }, { status: 201 });
	} catch (error) {
		return handleApiError(error);
	}
}
