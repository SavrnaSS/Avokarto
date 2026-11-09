import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/backend/auth";
import { getAdminProductLiveState } from "@/lib/backend/admin-data";
import { handleApiError, json } from "@/lib/backend/http";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Polled by the open product edit page on every "products"/"orders"
// realtime event. A deleted product returns data: null rather than 404 so
// the page can say so instead of showing a load error.
export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		await requireAdmin(request);
		const { id } = await params;

		return json({ data: await getAdminProductLiveState(id) });
	} catch (error) {
		return handleApiError(error);
	}
}
