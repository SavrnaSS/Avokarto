import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/backend/auth";
import { handleApiError, json } from "@/lib/backend/http";
import { listAdminPayouts } from "@/lib/backend/resellers";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
	try {
		await requireAdmin(request);
		return json({ data: await listAdminPayouts(request.nextUrl.searchParams.get("status") ?? undefined) });
	} catch (error) {
		return handleApiError(error);
	}
}
