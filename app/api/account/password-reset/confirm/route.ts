import { NextRequest } from "next/server";
import { z } from "zod";
import {
	createCustomerSessionToken,
	customerSessionCookie,
	getCustomerSessionCookieOptions,
} from "@/lib/backend/customer-auth";
import { handleApiError, json, parseJson } from "@/lib/backend/http";
import { confirmPasswordReset } from "@/lib/backend/password-reset";
import { getPasswordStrength, RELAXED_PASSWORD_MESSAGE } from "@/lib/passwordValidation";
import { assertSameOrigin, clientIp, consumeRateLimit, rateLimits } from "@/lib/backend/request-guard";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const confirmSchema = z.object({
	code: z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit code."),
	email: z.email(),
	newPassword: z.string().min(8, "Password must be at least 8 characters."),
});

// Checks the code, sets the new password and signs the customer in.
export async function POST(request: NextRequest) {
	try {
		assertSameOrigin(request);
		await consumeRateLimit(rateLimits.passwordResetConfirm, clientIp(request));
		const input = await parseJson(request, confirmSchema);

		// Same rule as sign-up and password change (8+ characters plus a number,
		// symbol or capital) - the reset form enforces it too.
		if (getPasswordStrength(input.newPassword).label === "Weak") {
			return json({ error: { code: "WEAK_PASSWORD", message: RELAXED_PASSWORD_MESSAGE } }, { status: 400 });
		}

		const session = await confirmPasswordReset(input.email, input.code, input.newPassword);
		const response = json({ customer: session });
		response.cookies.set(customerSessionCookie, await createCustomerSessionToken(session), getCustomerSessionCookieOptions());
		return response;
	} catch (error) {
		return handleApiError(error);
	}
}
