import { NextRequest } from "next/server";
import { z } from "zod";
import { requireCustomer } from "@/lib/backend/customer-auth";
import {
	getCustomerReviewableProducts,
	submitCustomerReview,
} from "@/lib/backend/customer-data";
import { handleApiError, json, parseJson } from "@/lib/backend/http";
import { assertSameOrigin, clientIp, consumeRateLimit, rateLimits } from "@/lib/backend/request-guard";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const reviewSchema = z.object({
	productId: z.string().min(1),
	rating: z.coerce.number().int().min(1).max(5),
	review: z.string().trim().min(1).max(2000),
});

export async function GET(request: NextRequest) {
	try {
		const session = await requireCustomer(request);
		const products = await getCustomerReviewableProducts(session.sub);

		return json({ data: products });
	} catch (error) {
		return handleApiError(error);
	}
}

export async function POST(request: NextRequest) {
	try {
		assertSameOrigin(request);
		await consumeRateLimit(rateLimits.review, clientIp(request));
		const session = await requireCustomer(request);
		const input = await parseJson(request, reviewSchema);

		await submitCustomerReview(
			session.sub,
			session.name,
			input.productId,
			input.rating,
			input.review,
		);

		return json({ ok: true }, { status: 201 });
	} catch (error) {
		return handleApiError(error);
	}
}
