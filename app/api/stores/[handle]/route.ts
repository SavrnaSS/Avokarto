import { NextRequest } from "next/server";
import { HttpError, handleApiError, json } from "@/lib/backend/http";
import { getPublicStorefront } from "@/lib/backend/resellers";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ handle: string }> }) {
	try {
		const { handle } = await params;
		const storefront = await getPublicStorefront(handle);
		if (!storefront) throw new HttpError(404, "Store not found.", "STORE_NOT_FOUND");
		return json({ data: storefront });
	} catch (error) {
		return handleApiError(error);
	}
}
