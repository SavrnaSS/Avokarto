import { NextRequest } from "next/server";
import { requireCustomer } from "@/lib/backend/customer-auth";
import { handleApiError, json } from "@/lib/backend/http";
import { assertSameOrigin } from "@/lib/backend/request-guard";
import { deleteSellerVideo } from "@/lib/backend/seller-videos";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

export async function DELETE(request: NextRequest, { params }: RouteContext) {
	try {
		assertSameOrigin(request);
		const session = await requireCustomer(request);
		const { id } = await params;
		await deleteSellerVideo(session.sub, id);
		return json({ ok: true });
	} catch (error) {
		return handleApiError(error);
	}
}
