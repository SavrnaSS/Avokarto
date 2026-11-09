import { NextRequest } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/backend/auth";
import { handleApiError, json, parseJson } from "@/lib/backend/http";
import { generateProductReviews } from "@/lib/backend/review-generator";
import { assertSameOrigin } from "@/lib/backend/request-guard";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const generateSchema = z.object({
	count: z.number().int().min(1).max(50).default(8),
	profile: z.enum(["glowing", "mixed", "realistic"]).default("realistic"),
	spreadDays: z.number().int().min(1).max(365).default(60),
	status: z.enum(["approved", "pending"]).default("approved"),
});

export async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		assertSameOrigin(request);
		await requireAdmin(request);
		const { id } = await params;
		const input = await parseJson(request, generateSchema);
		const result = await generateProductReviews(id, input);

		return json({ data: result }, { status: 201 });
	} catch (error) {
		return handleApiError(error);
	}
}
