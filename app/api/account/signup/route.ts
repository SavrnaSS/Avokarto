import { NextRequest } from "next/server";
import { z } from "zod";
import {
	createCustomerSessionToken,
	customerSessionCookie,
	getCustomerSessionCookieOptions,
	registerCustomer,
} from "@/lib/backend/customer-auth";
import { handleApiError, json, parseJson } from "@/lib/backend/http";
import { getPasswordStrength, RELAXED_PASSWORD_MESSAGE } from "@/lib/passwordValidation";
import { assertSameOrigin, clientIp, consumeRateLimit, rateLimits } from "@/lib/backend/request-guard";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const signupSchema = z.object({
	email: z.email(),
	// Optional: the quick sign-up asks only for email and password.
	name: z.string().trim().max(120).optional(),
	password: z.string().min(8, "Password must be at least 8 characters."),
});

/** "riya.sharma_22@x.com" -> "Riya Sharma" - a friendly default the account can rename later. */
function nameFromEmail(email: string) {
	const words = email.split("@")[0].replace(/[0-9]+/g, " ").split(/[._+-]+|\s+/).filter(Boolean);
	const name = words.map((word) => word[0].toUpperCase() + word.slice(1).toLowerCase()).join(" ").slice(0, 60);
	return name || "Avokarto seller";
}

export async function POST(request: NextRequest) {
	try {
		assertSameOrigin(request);
		await consumeRateLimit(rateLimits.signup, clientIp(request));
		const input = await parseJson(request, signupSchema);

		// Re-check the strength the signup form enforces (8+ characters plus a
		// number, symbol or mixed case) - client-side validation is a UX
		// nicety, never a security boundary.
		if (getPasswordStrength(input.password).label === "Weak") {
			return json(
				{
					error: {
						code: "WEAK_PASSWORD",
						message: RELAXED_PASSWORD_MESSAGE,
					},
				},
				{ status: 400 },
			);
		}

		const session = await registerCustomer(
			input.name || nameFromEmail(input.email),
			input.email,
			input.password,
		);
		const token = await createCustomerSessionToken(session);
		const response = json({ customer: session }, { status: 201 });

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
