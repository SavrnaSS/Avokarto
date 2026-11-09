import { dbQuery, hasDatabaseConfig } from "@/lib/backend/db";
import { handleApiError, json } from "@/lib/backend/http";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
	if (!hasDatabaseConfig()) {
		return json(
			{
				checks: {
					database: "missing DATABASE_URL",
				},
				ok: false,
			},
			{ status: 503 },
		);
	}

	try {
		await dbQuery("SELECT 1");

		return json({
			checks: {
				database: "ok",
			},
			ok: true,
		});
	} catch (error) {
		return handleApiError(error);
	}
}
