import { after, NextRequest } from "next/server";
import { notifyAdmins } from "@/lib/backend/admin-alerts";
import { createContactSubmission } from "@/lib/backend/contact";
import { handleApiError, json } from "@/lib/backend/http";
import { assertSameOrigin, clientIp, consumeRateLimit, rateLimits } from "@/lib/backend/request-guard";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
	try {
		assertSameOrigin(request);
		await consumeRateLimit(rateLimits.contact, clientIp(request));
		const body = await request.json().catch(() => ({}));
		const data = await createContactSubmission(body);
		// Honeypot hits come back without a ticket - nothing to alert about.
		if (data.ticketNumber) {
			const name = `${String(body.firstName ?? "")} ${String(body.lastName ?? "")}`.trim();
			after(() =>
				notifyAdmins("newTicket", {
					lines: [["Ticket", data.ticketNumber], ["From", name || "-"], ["Email", String(body.email ?? "-")]],
					link: "/admin/support-tickets",
					subject: `New support ticket ${data.ticketNumber}${name ? ` from ${name}` : ""}`,
					title: "A customer needs a reply",
				}),
			);
		}

		return json({ data }, { status: 201 });
	} catch (error) {
		return handleApiError(error);
	}
}
