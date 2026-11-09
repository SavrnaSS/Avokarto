import { NextRequest } from "next/server";
import { sendTestAlert } from "@/lib/backend/admin-alerts";
import { requireAdmin } from "@/lib/backend/auth";
import { handleApiError, json } from "@/lib/backend/http";
import { assertSameOrigin, consumeRateLimit, rateLimits } from "@/lib/backend/request-guard";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// "Send test email" - mails the saved recipients so delivery can be checked.
export async function POST(request: NextRequest) {
	try {
		assertSameOrigin(request);
		const admin = await requireAdmin(request);
		await consumeRateLimit(rateLimits.adminTestAlert, admin.sub);
		return json({ data: await sendTestAlert() });
	} catch (error) {
		return handleApiError(error);
	}
}
