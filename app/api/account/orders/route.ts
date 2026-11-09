import { NextRequest } from "next/server";
import { requireCustomer } from "@/lib/backend/customer-auth";
import { getCustomerOrders } from "@/lib/backend/customer-data";
import { handleApiError, json } from "@/lib/backend/http";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
	try {
		const session = await requireCustomer(request);
		const orders = await getCustomerOrders(session.sub);

		return json({ data: orders });
	} catch (error) {
		return handleApiError(error);
	}
}
