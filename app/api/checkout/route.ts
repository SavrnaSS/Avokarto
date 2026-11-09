import { after, NextRequest } from "next/server";
import { createCheckoutOrder } from "@/lib/backend/checkout";
import { notifyAdmins } from "@/lib/backend/admin-alerts";
import { sendEmail } from "@/lib/backend/email";
import { handleApiError, json } from "@/lib/backend/http";
import { buildOrderConfirmationEmail } from "@/lib/backend/orderEmails";
import { getOptionalCustomer } from "@/lib/backend/customer-auth";
import { assertSameOrigin, clientIp, consumeRateLimit, rateLimits } from "@/lib/backend/request-guard";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
	try {
		assertSameOrigin(request);
		await consumeRateLimit(rateLimits.checkout, clientIp(request));
		const body = await request.json().catch(() => ({}));
		const session = await getOptionalCustomer(request);
		const { order, confirmationEmail } = await createCheckoutOrder(body, {
			customerId: session?.sub,
		});

		// The order is committed. Send the confirmation after the response has
		// gone out, so the shopper never waits on (or sees a failure from) the
		// email provider. Best-effort: sendEmail logs and never throws.
		after(async () => {
			const email = buildOrderConfirmationEmail(confirmationEmail);
			await sendEmail({
				to: confirmationEmail.customerEmail,
				fromName: email.fromName,
				subject: email.subject,
				html: email.html,
				text: email.text,
				// Order numbers are unique, so a retried send can't duplicate.
				idempotencyKey: `order-confirmation/${confirmationEmail.orderNumber}`,
			});
			const money = new Intl.NumberFormat("en-US", { currency: confirmationEmail.currency || "USD", style: "currency" });
			await notifyAdmins("newOrder", {
				lines: [
					["Order", `#${confirmationEmail.orderNumber}`],
					["Customer", confirmationEmail.customerName || confirmationEmail.customerEmail],
					["Items", String((confirmationEmail.items ?? []).reduce((sum, item) => sum + item.quantity, 0))],
					["Total", money.format(confirmationEmail.total ?? 0)],
					...(confirmationEmail.store ? [["Seller store", confirmationEmail.store.name] as [string, string]] : []),
				],
				link: `/admin/orders/${encodeURIComponent(confirmationEmail.orderNumber)}`,
				subject: `New order #${confirmationEmail.orderNumber} - ${money.format(confirmationEmail.total ?? 0)}`,
				title: "New order to fulfil",
			});
		});

		return json({ data: order }, { status: 201 });
	} catch (error) {
		return handleApiError(error);
	}
}
