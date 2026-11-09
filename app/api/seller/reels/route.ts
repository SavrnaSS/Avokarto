import { NextRequest } from "next/server";
import { requireCustomer } from "@/lib/backend/customer-auth";
import { handleApiError, json } from "@/lib/backend/http";
import { listSellerReels } from "@/lib/backend/product-reels";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Promo reels for the products in the signed-in seller's store.
export async function GET(request: NextRequest) {
	try {
		const session = await requireCustomer(request);
		return json({ data: await listSellerReels(session.sub) });
	} catch (error) {
		return handleApiError(error);
	}
}
