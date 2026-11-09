import { NextRequest } from "next/server";
import { getOptionalCustomer } from "@/lib/backend/customer-auth";
import { json } from "@/lib/backend/http";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
	// Logged-out is the common case for this endpoint (every page checks it),
	// so this resolves to `{ customer: null }` with a 200 instead of a 401 -
	// no noisy "failed" network request for what's actually expected state.
	const customer = await getOptionalCustomer(request);
	return json({ customer });
}
