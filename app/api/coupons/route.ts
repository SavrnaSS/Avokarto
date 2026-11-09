import { handleApiError, json } from "@/lib/backend/http";
import { getPublicCoupons } from "@/lib/backend/storefront-data";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
	try {
		const coupons = await getPublicCoupons();

		return json({ data: coupons });
	} catch (error) {
		return handleApiError(error);
	}
}
