import { NextRequest } from "next/server";
import { requireCustomer } from "@/lib/backend/customer-auth";
import { handleApiError, json } from "@/lib/backend/http";
import { listSellerOrders } from "@/lib/backend/resellers";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
	try {
		const session = await requireCustomer(request);
		return json({ data: await listSellerOrders(session.sub) });
	} catch (error) {
		return handleApiError(error);
	}
}
