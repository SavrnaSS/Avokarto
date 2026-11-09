import { NextRequest } from "next/server";
import { z } from "zod";
import { requireCustomer } from "@/lib/backend/customer-auth";
import { changeCustomerPassword } from "@/lib/backend/customer-data";
import { handleApiError, json, parseJson } from "@/lib/backend/http";
import { getPasswordStrength, RELAXED_PASSWORD_MESSAGE } from "@/lib/passwordValidation";
import { assertSameOrigin, clientIp, consumeRateLimit, rateLimits } from "@/lib/backend/request-guard";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const passwordSchema = z.object({
	currentPassword: z.string().min(1),
	newPassword: z.string().min(8),
});

export async function POST(request: NextRequest) {
	try {
		assertSameOrigin(request);
		await consumeRateLimit(rateLimits.passwordChange, clientIp(request));
		const session = await requireCustomer(request);
		const input = await parseJson(request, passwordSchema);

		if (getPasswordStrength(input.newPassword).label === "Weak") {
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

		await changeCustomerPassword(
			session.sub,
			input.currentPassword,
			input.newPassword,
		);

		return json({ ok: true });
	} catch (error) {
		return handleApiError(error);
	}
}
