import { NextRequest } from "next/server";
import { requireCustomer } from "@/lib/backend/customer-auth";
import { handleApiError, json } from "@/lib/backend/http";
import { requireStoreForCustomer } from "@/lib/backend/resellers";
import { getStoreInsights } from "@/lib/backend/store-insights";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
	try {
		const session = await requireCustomer(request);
		const store = await requireStoreForCustomer(session.sub);
		const days = Number(request.nextUrl.searchParams.get("days") ?? 30);
		return json({ data: await getStoreInsights(store.id, days) });
	} catch (error) {
		return handleApiError(error);
	}
}
