import { NextRequest } from "next/server";
import { z } from "zod";
import { handleApiError, json } from "@/lib/backend/http";
import {
	getTopSellingProducts,
	type TopSellingPeriod,
} from "@/lib/backend/storefront-data";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const periodSchema = z.enum(["all-time", "this-month", "this-week", "this-year"]);

export async function GET(request: NextRequest) {
	try {
		const searchParams = request.nextUrl.searchParams;
		const parsedPeriod = periodSchema.safeParse(searchParams.get("period"));
		const period: TopSellingPeriod = parsedPeriod.success
			? parsedPeriod.data
			: "this-week";
		const limit = Number(searchParams.get("limit") ?? "8");
		const data = await getTopSellingProducts({ limit, period });

		return json({ data });
	} catch (error) {
		return handleApiError(error);
	}
}
