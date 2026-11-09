import { NextRequest } from "next/server";
import { z } from "zod";
import {
	authorizeCustomer,
	createCustomerSessionToken,
	customerSessionCookie,
	getCustomerSessionCookieOptions,
} from "@/lib/backend/customer-auth";
import {
	adminSessionCookie,
	authorizeAdmin,
	createAdminSessionToken,
	getSessionCookieOptions,
} from "@/lib/backend/auth";
import { handleApiError, HttpError, json, parseJson } from "@/lib/backend/http";
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
		let session;
		try {
			session = await guardLogin(request, "customer", credentials.email, () =>
				authorizeCustomer(credentials.email, credentials.password),
			);
		} catch (error) {
			// Admins who use the storefront sign-in by mistake: if the same
			// email and password are a valid admin login, start the admin
			// session and send them to the console. Anything else keeps the
			// customer error, so nothing is revealed about admin accounts.
			if (!(error instanceof HttpError) || error.status !== 401) throw error;
			const admin = await authorizeAdmin(credentials.email, credentials.password).catch(() => null);
			if (!admin) throw error;
			const response = json({ admin: true, redirect: "/admin" });
			const maxAge = await getAdminSessionMaxAge();
			response.cookies.set(adminSessionCookie, await createAdminSessionToken(admin, maxAge), getSessionCookieOptions(maxAge));
			return response;
		}
		const token = await createCustomerSessionToken(session);
		const response = json({ customer: session });

		response.cookies.set(
			customerSessionCookie,
			token,
			getCustomerSessionCookieOptions(),
		);

		return response;
	} catch (error) {
		return handleApiError(error);
	}
}
