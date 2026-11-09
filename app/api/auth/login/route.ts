import { NextRequest } from "next/server";
import { z } from "zod";
import {
	adminSessionCookie,
	authorizeAdmin,
	createAdminSessionToken,
	getSessionCookieOptions,
} from "@/lib/backend/auth";
import { handleApiError, json, parseJson } from "@/lib/backend/http";
import { getAdminSessionMaxAge } from "@/lib/backend/store-policy";
import { assertSameOrigin, guardLogin } from "@/lib/backend/request-guard";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const loginSchema = z.object({
	email: z.email(),
	password: z.string().min(1),
});

export async function POST(request: NextRequest) {
	try {
		assertSameOrigin(request);
		const credentials = await parseJson(request, loginSchema);
		const session = await guardLogin(request, "admin", credentials.email, () =>
			authorizeAdmin(credentials.email, credentials.password),
		);
		// Session length from Settings -> Permissions.
		const maxAge = await getAdminSessionMaxAge();
		const token = await createAdminSessionToken(session, maxAge);
		const response = json({ user: session });

		response.cookies.set(adminSessionCookie, token, getSessionCookieOptions(maxAge));

		return response;
	} catch (error) {
		return handleApiError(error);
	}
}
