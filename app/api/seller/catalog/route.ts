import { NextRequest } from "next/server";
import { requireCustomer } from "@/lib/backend/customer-auth";
import { handleApiError, json } from "@/lib/backend/http";
import { browseResellerCatalog, CATALOG_SORTS, type CatalogSort } from "@/lib/backend/resellers";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
	try {
		const session = await requireCustomer(request);
		const params = request.nextUrl.searchParams;
		const sort = params.get("sort");
		const data = await browseResellerCatalog(session.sub, {
			category: params.get("category") ?? undefined,
			hideAdded: params.get("hideAdded") === "1",
			limit: Number(params.get("limit") ?? 24),
			offset: Number(params.get("offset") ?? 0),
			search: params.get("q") ?? undefined,
			// Unknown values fall back to the default rather than erroring.
			sort: (CATALOG_SORTS as readonly string[]).includes(sort ?? "") ? (sort as CatalogSort) : undefined,
		});
		return json({ data });
	} catch (error) {
		return handleApiError(error);
	}
}
