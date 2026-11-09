import { NextRequest } from "next/server";
import { z } from "zod";
import { handleApiError, json } from "@/lib/backend/http";
import { listStorefrontProducts } from "@/lib/backend/storefront-data";
import { normalizeCategoryNames } from "@/lib/storefront-categories";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
	try {
		const searchParams = request.nextUrl.searchParams;
		const limit = Number(searchParams.get("limit") ?? "24");
		const offset = Number(searchParams.get("offset") ?? "0");
		const search = searchParams.get("q") ?? searchParams.get("search") ?? undefined;
		const categories = normalizeCategoryNames(searchParams.getAll("category"));
		const productIds = z.array(z.string().trim().min(1).max(100)).max(24)
			.parse([...new Set(searchParams.getAll("productId"))]);
		const catalogIds = [
			...new Set(
				searchParams
					.getAll("catalogId")
					.flatMap((value) => value.split(","))
					.map((value) => value.trim())
					.flatMap((value) => {
						const result = z.uuid().safeParse(value);
						return result.success ? [result.data] : [];
					}),
			),
		].slice(0, 24);
		const products = await listStorefrontProducts({ catalogIds, productIds, categories, limit, offset, search });

		return json({ data: products });
	} catch (error) {
		return handleApiError(error);
	}
}
