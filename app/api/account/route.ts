import { NextRequest } from "next/server";
import {
	customerSessionCookie,
	getCustomerSessionCookieOptions,
	requireCustomer,
} from "@/lib/backend/customer-auth";
import { deactivateCustomer } from "@/lib/backend/customer-data";
import { handleApiError, json } from "@/lib/backend/http";
import { assertSameOrigin } from "@/lib/backend/request-guard";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function DELETE(request: NextRequest) {
	try {
		assertSameOrigin(request);
		const session = await requireCustomer(request);
		await deactivateCustomer(session.sub);

		const response = json({ ok: true });
		response.cookies.set(customerSessionCookie, "", {
			...getCustomerSessionCookieOptions(),
			maxAge: 0,
		});

		return response;
	} catch (error) {
		return handleApiError(error);
	}
}
