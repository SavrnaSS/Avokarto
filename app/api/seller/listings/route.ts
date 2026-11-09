import { NextRequest } from "next/server";
import { requireCustomer } from "@/lib/backend/customer-auth";
import { handleApiError, json } from "@/lib/backend/http";
import { assertSameOrigin } from "@/lib/backend/request-guard";
import { z } from "zod";
import { listStoreListings, requireStoreForCustomer, saveListing } from "@/lib/backend/resellers";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
	try {
		const session = await requireCustomer(request);
		const store = await requireStoreForCustomer(session.sub);
		return json({ data: await listStoreListings(store.id) });
	} catch (error) {
		return handleApiError(error);
	}
}

const addSchema = z.object({ productId: z.string().uuid() }).passthrough();

// Add a catalog product to the store (or update its margin if present).
export async function POST(request: NextRequest) {
	try {
		assertSameOrigin(request);
		const session = await requireCustomer(request);
		const body = addSchema.parse(await request.json().catch(() => ({})));
		return json({ data: await saveListing(session.sub, body.productId, body) }, { status: 201 });
	} catch (error) {
		return handleApiError(error);
	}
}
