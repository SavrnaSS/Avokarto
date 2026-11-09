import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/backend/auth";
import { handleApiError, HttpError, json } from "@/lib/backend/http";
import { assertSameOrigin } from "@/lib/backend/request-guard";
import { getAdminStore, moderateStore } from "@/lib/backend/resellers";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: RouteContext) {
	try {
		await requireAdmin(request);
		const { id } = await params;
		const store = await getAdminStore(id);
		if (!store) throw new HttpError(404, "Store not found.", "STORE_NOT_FOUND");
		return json({ data: store });
	} catch (error) {
		return handleApiError(error);
	}
}

// Suspend / reactivate a store, or block / unblock its payouts.
export async function PATCH(request: NextRequest, { params }: RouteContext) {
	try {
		assertSameOrigin(request);
		await requireAdmin(request);
		const { id } = await params;
		return json({ data: await moderateStore(id, await request.json().catch(() => ({}))) });
	} catch (error) {
		return handleApiError(error);
	}
}
