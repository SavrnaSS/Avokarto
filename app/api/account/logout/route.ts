import { NextRequest } from "next/server";
import {
	customerSessionCookie,
	getCustomerSessionCookieOptions,
} from "@/lib/backend/customer-auth";
import { json } from "@/lib/backend/http";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(_request: NextRequest) {
	const response = json({ ok: true });
	response.cookies.set(customerSessionCookie, "", {
		...getCustomerSessionCookieOptions(),
		maxAge: 0,
	});

	return response;
}
