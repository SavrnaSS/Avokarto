import { handleApiError, json } from "@/lib/backend/http";
import { getAdminBrands } from "@/lib/backend/admin-data";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
	try {
		const brands = await getAdminBrands();
		return json({ data: brands.filter((brand) => brand.status === "published") });
	} catch (error) {
		return handleApiError(error);
	}
}
