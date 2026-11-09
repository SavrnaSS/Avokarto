import { NextRequest } from "next/server";
import { getOptionalCustomer, requireCustomer } from "@/lib/backend/customer-auth";
import { handleApiError, json } from "@/lib/backend/http";
import { assertSameOrigin, consumeRateLimit, rateLimits } from "@/lib/backend/request-guard";
import { getFollowState, setFollowing } from "@/lib/backend/seller-profiles";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Params = { params: Promise<{ handle: string }> };

// Follower count, and whether the signed-in shopper follows this seller.
export async function GET(request: NextRequest, { params }: Params) {
	try {
		const { handle } = await params;
		const customer = await getOptionalCustomer(request);
		return json({ data: await getFollowState(handle, customer?.sub ?? null) });
	} catch (error) {
		return handleApiError(error);
	}
}

async function change(request: NextRequest, { params }: Params, follow: boolean) {
	try {
		assertSameOrigin(request);
		const session = await requireCustomer(request);
		await consumeRateLimit(rateLimits.sellerFollow, session.sub);
		const { handle } = await params;
		return json({ data: await setFollowing(handle, session.sub, follow) });
	} catch (error) {
		return handleApiError(error);
	}
}

export function POST(request: NextRequest, context: Params) {
	return change(request, context, true);
}

export function DELETE(request: NextRequest, context: Params) {
	return change(request, context, false);
}
