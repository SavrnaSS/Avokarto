import { handleApiError, json } from "@/lib/backend/http";
import { listStorefrontCategories } from "@/lib/backend/storefront-categories";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
	try {
		return json({ data: await listStorefrontCategories() });
	} catch (error) {
		return handleApiError(error);
	}
}
