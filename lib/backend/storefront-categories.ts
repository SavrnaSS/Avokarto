import { dbQuery } from "./db";
import type { StorefrontCategory } from "@/lib/storefront-categories";

export async function listStorefrontCategories(): Promise<StorefrontCategory[]> {
  const result = await dbQuery<StorefrontCategory>(`
    SELECT c.id::text, c.name, c.slug, c.image_url AS image, c.status,
      c.sort_order AS "sortOrder", COUNT(p.id)::int AS count
    FROM categories c
    LEFT JOIN products p ON p.category_id = c.id
      AND p.status IN ('published', 'low stock')
    WHERE c.status = 'published'
    GROUP BY c.id
    ORDER BY c.sort_order ASC, lower(c.name) ASC, c.id ASC
  `);
  return result.rows;
}
