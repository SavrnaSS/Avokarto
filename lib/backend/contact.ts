import { z } from "zod";
import { dbQuery } from "@/lib/backend/db";

const contactSchema = z.object({
	firstName: z.string().trim().min(1).max(100),
	lastName: z.string().trim().min(1).max(100),
	email: z.string().trim().email().max(200),
	phone: z.string().trim().max(40).optional().default(""),
	message: z.string().trim().min(1).max(4000),
	// Hidden honeypot field - real visitors never see or fill it (see
	// ContactForm.tsx). Bots that fill every field trip this.
	company: z.string().optional().default(""),
});

function ticketNumber() {
	const timestamp = Date.now().toString(36).toUpperCase();
	const suffix = Math.random().toString(36).slice(2, 7).toUpperCase();
	return `CT-${timestamp}-${suffix}`;
}

/**
 * Creates a support ticket from a storefront /contact submission, reusing
 * the same queue admin staff already work from (realtime-visible in
 * /admin/support-tickets the moment it's inserted) rather than a parallel,
 * unmonitored inbox.
 */
export async function createContactSubmission(body: unknown) {
	const input = contactSchema.parse(body);

	if (input.company.trim()) {
		// Honeypot tripped - pretend success so the bot doesn't learn to
		// leave the field blank, but skip the actual write.
		return { id: "", ticketNumber: "" };
	}

	const customerName = `${input.firstName} ${input.lastName}`.trim();
	const result = await dbQuery<{ id: string; ticket_number: string }>(
		`
			INSERT INTO support_tickets
				(ticket_number, title, customer_name, priority, status, assignee, email, phone, message)
			VALUES ($1, $2, $3, 'Medium', 'open', 'Support Team', $4, $5, $6)
			RETURNING id::text, ticket_number
		`,
		[
			ticketNumber(),
			`Contact form: ${customerName}`,
			customerName,
			input.email,
			input.phone || null,
			input.message,
		],
	);

	return { id: result.rows[0].id, ticketNumber: result.rows[0].ticket_number };
}
