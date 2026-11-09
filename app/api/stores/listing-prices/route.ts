import { NextRequest } from "next/server";
import { handleApiError, json } from "@/lib/backend/http";
import { getListingPrices } from "@/lib/backend/resellers";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Current store prices for cart lines bought through reseller stores.
export async function GET(request: NextRequest) {
	try {
		return json({ data: await getListingPrices(request.nextUrl.searchParams.getAll("id")) });
	} catch (error) {
		return handleApiError(error);
	}
}
