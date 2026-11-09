import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/backend/auth";
import { handleApiError, json } from "@/lib/backend/http";
import { deleteProductReel, updateProductReel } from "@/lib/backend/product-reels";
import { assertSameOrigin } from "@/lib/backend/request-guard";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string; reelId: string }> };

// Rename a reel ({ title }) or move it ({ move: "up" | "down" }); returns the product's reels.
export async function PATCH(request: NextRequest, { params }: RouteContext) {
	try {
		assertSameOrigin(request);
		await requireAdmin(request);
		const { id, reelId } = await params;
		return json({ data: await updateProductReel(id, reelId, await request.json().catch(() => ({}))) });
	} catch (error) {
		return handleApiError(error);
	}
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
	try {
		assertSameOrigin(request);
		await requireAdmin(request);
		const { id, reelId } = await params;
		await deleteProductReel(id, reelId);
		return json({ data: { ok: true } });
	} catch (error) {
		return handleApiError(error);
	}
}
