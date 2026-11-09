import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/backend/auth";
import { handleApiError, json } from "@/lib/backend/http";
import { assertSameOrigin } from "@/lib/backend/request-guard";
import { processPayout } from "@/lib/backend/resellers";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Mark a payout request paid (with the transfer reference) or reject it.
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		assertSameOrigin(request);
		await requireAdmin(request);
		const { id } = await params;
		return json({ data: await processPayout(id, await request.json().catch(() => ({}))) });
	} catch (error) {
		return handleApiError(error);
	}
}
