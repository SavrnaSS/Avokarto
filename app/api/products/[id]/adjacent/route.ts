import { NextRequest } from "next/server";
import { handleApiError, json } from "@/lib/backend/http";
import { getAdjacentProducts } from "@/lib/backend/storefront-data";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
	_request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const { id } = await params;
		const data = await getAdjacentProducts(id);

		return json({ data });
	} catch (error) {
		return handleApiError(error);
	}
}
