import { handleApiError, json } from "@/lib/backend/http";
import { getAdminShippingMethods } from "@/lib/backend/admin-data";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
	try {
		const methods = await getAdminShippingMethods();
		return json({ data: methods.filter((method) => method.status === "active") });
	} catch (error) {
		return handleApiError(error);
	}
}
