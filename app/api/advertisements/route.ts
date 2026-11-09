import { handleApiError, json } from "@/lib/backend/http";
import { getAdminAdvertisements } from "@/lib/backend/admin-data";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
	try {
		const advertisements = await getAdminAdvertisements();
		return json({
			data: advertisements.filter((advertisement) => advertisement.status === "active"),
		});
	} catch (error) {
		return handleApiError(error);
	}
}
