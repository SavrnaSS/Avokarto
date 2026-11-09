import { NextRequest } from "next/server";
import { z } from "zod";
import {
	createCustomerSessionToken,
	customerSessionCookie,
	getCustomerSessionCookieOptions,
	requireCustomer,
} from "@/lib/backend/customer-auth";
import { getCustomerProfile, updateCustomerProfile } from "@/lib/backend/customer-data";
import { handleApiError, json, parseJson } from "@/lib/backend/http";
import { assertSameOrigin } from "@/lib/backend/request-guard";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const addressSchema = z.object({
	address1: z.string().trim().max(200).default(""),
	city: z.string().trim().max(120).default(""),
	country: z.string().trim().max(120).default(""),
	postcode: z.string().trim().max(30).default(""),
});

const updateSchema = z.object({
	alternateAddress: addressSchema.optional(),
	dateOfBirth: z
		.union([z.string().trim().min(1), z.null()])
		.optional(),
	defaultAddress: addressSchema.optional(),
	email: z.email().optional(),
	locale: z.string().trim().min(1).max(60).optional(),
	name: z.string().trim().min(1).max(200).optional(),
	phone: z.string().trim().max(40).optional(),
});

export async function GET(request: NextRequest) {
	try {
		const session = await requireCustomer(request);
		const profile = await getCustomerProfile(session.sub);

		return json({ profile });
	} catch (error) {
		return handleApiError(error);
	}
}

export async function PATCH(request: NextRequest) {
	try {
		assertSameOrigin(request);
		const session = await requireCustomer(request);
		const input = await parseJson(request, updateSchema);
		const profile = await updateCustomerProfile(session.sub, input);
		const response = json({ profile });

		// The session cookie carries the name and email; re-issue it when
		// either changed so the header, dashboard and /me show them at once.
		if (profile.name !== session.name || profile.email !== session.email) {
			response.cookies.set(
				customerSessionCookie,
				await createCustomerSessionToken({ email: profile.email, name: profile.name, sub: session.sub }),
				getCustomerSessionCookieOptions(),
			);
		}

		return response;
	} catch (error) {
		return handleApiError(error);
	}
}
