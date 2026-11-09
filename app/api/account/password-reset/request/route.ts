import { NextRequest } from "next/server";
import { z } from "zod";
import { handleApiError, json, parseJson } from "@/lib/backend/http";
import { requestPasswordReset } from "@/lib/backend/password-reset";
import { assertSameOrigin, clientIp, consumeRateLimit, rateLimits } from "@/lib/backend/request-guard";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const requestSchema = z.object({ email: z.email() });

// Emails a reset code. Always the same reply, whether or not the account exists.
export async function POST(request: NextRequest) {
	try {
		assertSameOrigin(request);
		await consumeRateLimit(rateLimits.passwordResetRequestByIp, clientIp(request));
		const { email } = await parseJson(request, requestSchema);
		await consumeRateLimit(rateLimits.passwordResetRequestByEmail, email.trim().toLowerCase());
		await requestPasswordReset(email);
		return json({ ok: true });
	} catch (error) {
		return handleApiError(error);
	}
}
