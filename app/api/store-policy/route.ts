import { getStorePolicyForStorefront } from "@/lib/backend/store-policy";
import { handleApiError, json } from "@/lib/backend/http";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// The storefront's copy of the admin's free-shipping and payment settings
// (hooks/useStorePolicy.ts). Checkout re-checks both on the server.
export async function GET() {
	try {
		const response = json({ data: await getStorePolicyForStorefront() });
		response.headers.set("Cache-Control", "public, max-age=30, stale-while-revalidate=300");
		return response;
	} catch (error) {
		return handleApiError(error);
	}
}
