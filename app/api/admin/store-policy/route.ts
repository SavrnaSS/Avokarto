import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/backend/auth";
import { handleApiError, HttpError, json } from "@/lib/backend/http";
import { assertSameOrigin } from "@/lib/backend/request-guard";
import {
	getStoreSettingsPolicy,
	updateAdminSessionDays,
	updateFreeShipping,
	updatePaymentMethods,
} from "@/lib/backend/store-policy";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Admin -> Settings -> Shipping / Payments / Permissions.
export async function GET(request: NextRequest) {
	try {
		await requireAdmin(request);
		return json({ data: await getStoreSettingsPolicy() });
	} catch (error) {
		return handleApiError(error);
	}
}

/** Body: { section: "shipping" | "payments" | "permissions", ...that section's fields }. */
export async function PATCH(request: NextRequest) {
	try {
		assertSameOrigin(request);
		await requireAdmin(request);
		const body = (await request.json().catch(() => ({}))) as { section?: string };
		switch (body.section) {
			case "shipping":
				return json({ data: await updateFreeShipping(body) });
			case "payments":
				return json({ data: await updatePaymentMethods(body) });
			case "permissions":
				return json({ data: await updateAdminSessionDays(body) });
			default:
				throw new HttpError(400, "Unknown settings section.", "UNKNOWN_SECTION");
		}
	} catch (error) {
		return handleApiError(error);
	}
}
