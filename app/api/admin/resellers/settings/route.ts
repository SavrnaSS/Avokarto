import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/backend/auth";
import { handleApiError, json } from "@/lib/backend/http";
import { assertSameOrigin } from "@/lib/backend/request-guard";
import { getResellerSettings, updateResellerSettings } from "@/lib/backend/resellers";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
	try {
		await requireAdmin(request);
		return json({ data: await getResellerSettings() });
	} catch (error) {
		return handleApiError(error);
	}
}

export async function PUT(request: NextRequest) {
	try {
		assertSameOrigin(request);
		await requireAdmin(request);
		return json({ data: await updateResellerSettings(await request.json().catch(() => ({}))) });
	} catch (error) {
		return handleApiError(error);
	}
}
