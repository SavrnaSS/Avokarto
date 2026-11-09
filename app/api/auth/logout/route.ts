import { NextRequest } from "next/server";
import { adminSessionCookie, getSessionCookieOptions } from "@/lib/backend/auth";
import { json } from "@/lib/backend/http";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(_request: NextRequest) {
	const response = json({ ok: true });
	response.cookies.set(adminSessionCookie, "", {
		...getSessionCookieOptions(),
		maxAge: 0,
	});

	return response;
}
