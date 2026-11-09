import { dbQuery } from "@/lib/backend/db";

// products.rating / products.review_count are a denormalized snapshot (every
// product card and the storefront search index reads these two columns
// directly rather than aggregating product_reviews on every request) - call
// this after any write that can change which reviews count as 'approved'
// for a product: a new approved review, or a status change in either
// direction. Reviews stuck in 'pending'/'draft' never affect the totals.
export async function syncProductRatingSummary(productId: string) {
	await dbQuery(
		`
			UPDATE products
			SET
				rating = COALESCE(
					(SELECT ROUND(AVG(rating)::numeric, 2) FROM product_reviews WHERE product_id = $1 AND status = 'approved'),
					0
				),
				review_count = (SELECT COUNT(*) FROM product_reviews WHERE product_id = $1 AND status = 'approved')
			WHERE id = $1
		`,
		[productId],
	);
}
