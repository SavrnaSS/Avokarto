import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/backend/auth";
import { handleApiError, json } from "@/lib/backend/http";
import {
	getAdminResellerOverview,
	getResellerSettings,
	listAdminStores,
	refreshEarnings,
} from "@/lib/backend/resellers";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
	try {
		await requireAdmin(request);
		// One earnings refresh, then every read in parallel.
		await refreshEarnings();
		const [overview, stores, settings] = await Promise.all([
			getAdminResellerOverview(),
			listAdminStores(),
			getResellerSettings(),
		]);
		return json({ data: { overview, settings, stores } });
	} catch (error) {
		return handleApiError(error);
	}
}
