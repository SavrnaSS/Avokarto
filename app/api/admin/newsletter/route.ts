import { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/backend/auth";
import { handleApiError } from "@/lib/backend/http";
import { listNewsletterSubscribers } from "@/lib/backend/newsletter";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// The newsletter list as a CSV download (Customers -> "Newsletter list").
export async function GET(request: NextRequest) {
	try {
		await requireAdmin(request);
		const rows = await listNewsletterSubscribers();
		// Quote every cell; a leading = + - @ is neutralised so spreadsheets don't run it as a formula.
		const cell = (value: string) => `"${value.replace(/^([=+\-@])/, "'$1").replace(/"/g, '""')}"`;
		const csv = ["email,source,subscribed_at", ...rows.map((row) => [row.email, row.source, row.created_at.toISOString()].map(cell).join(","))].join("\r\n");
		return new Response(csv, {
			headers: {
				"Cache-Control": "no-store",
				"Content-Disposition": `attachment; filename="newsletter-${new Date().toISOString().slice(0, 10)}.csv"`,
				"Content-Type": "text/csv; charset=utf-8",
			},
		});
	} catch (error) {
		return handleApiError(error);
	}
}
