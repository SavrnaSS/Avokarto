import { NextRequest } from "next/server";
import { getAdminAlertSettings, updateAdminAlertSettings } from "@/lib/backend/admin-alerts";
import { requireAdmin } from "@/lib/backend/auth";
import { handleApiError, json } from "@/lib/backend/http";
import { assertSameOrigin } from "@/lib/backend/request-guard";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Admin -> Settings -> Notifications: alert recipients and event switches.
export async function GET(request: NextRequest) {
	try {
		await requireAdmin(request);
		return json({ data: await getAdminAlertSettings() });
	} catch (error) {
		return handleApiError(error);
	}
}

export async function PATCH(request: NextRequest) {
	try {
		assertSameOrigin(request);
		await requireAdmin(request);
		return json({ data: await updateAdminAlertSettings(await request.json().catch(() => ({}))) });
	} catch (error) {
		return handleApiError(error);
	}
}
