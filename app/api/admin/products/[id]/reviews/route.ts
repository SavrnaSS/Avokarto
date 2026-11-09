import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/backend/auth";
import { getAdminProductReviews } from "@/lib/backend/admin-data";
import { handleApiError, json } from "@/lib/backend/http";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		await requireAdmin(request);
		const { id } = await params;
		const reviews = await getAdminProductReviews(id);

		return json({ data: reviews });
	} catch (error) {
		return handleApiError(error);
	}
}
