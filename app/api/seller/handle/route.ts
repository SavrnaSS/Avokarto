import { NextRequest } from "next/server";
import { getOptionalCustomer } from "@/lib/backend/customer-auth";
import { handleApiError, json } from "@/lib/backend/http";
import { clientIp, consumeRateLimit, rateLimits } from "@/lib/backend/request-guard";
import { getStoreForCustomer, isHandleAvailable } from "@/lib/backend/resellers";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Live "is this store link free?" check while a seller types. Open to
// signed-out visitors too - /start asks for an account only after the
// store is designed - so those are rate limited per IP.
export async function GET(request: NextRequest) {
	try {
		const session = await getOptionalCustomer(request);
		if (!session) await consumeRateLimit(rateLimits.storeHandleCheck, clientIp(request));
		const handle = request.nextUrl.searchParams.get("handle") ?? "";
		const store = session ? await getStoreForCustomer(session.sub) : null;
		return json({ data: await isHandleAvailable(handle, store?.id) });
	} catch (error) {
		return handleApiError(error);
	}
}
