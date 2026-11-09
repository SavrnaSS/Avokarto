import { z } from "zod";
import { dbQuery } from "@/lib/backend/db";

const newsletterSchema = z.object({
	email: z.string().trim().toLowerCase().email().max(200),
	source: z.string().trim().max(40).optional().default("footer"),
	// Hidden honeypot field - real visitors never fill it.
	company: z.string().optional().default(""),
});

/**
 * Adds an address to the newsletter list. Signing up twice is fine (the
 * reply is the same), so the response never reveals who's already on it.
 */
export async function subscribeToNewsletter(body: unknown) {
	const input = newsletterSchema.parse(body);
	if (input.company.trim()) return;
	await dbQuery(
		`
			INSERT INTO newsletter_subscribers (email, source)
			VALUES ($1, $2)
			ON CONFLICT (email) DO UPDATE SET updated_at = now()
		`,
		[input.email, input.source || "footer"],
	);
}

export async function listNewsletterSubscribers() {
	const result = await dbQuery<{ created_at: Date; email: string; source: string }>(
		"SELECT email, source, created_at FROM newsletter_subscribers ORDER BY created_at DESC",
	);
	return result.rows;
}
