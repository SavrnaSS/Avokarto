import { dbQuery, hasDatabaseConfig } from "@/lib/backend/db";
import { absoluteUrl, siteUrl } from "@/lib/seo";
import { isIndexablePath } from "@/lib/seoRoutes";
import { SITEMAP_PAGE_SIZE, type SitemapEntry } from "@/lib/seo-sitemaps";

function requireCatalog() {
  if (!hasDatabaseConfig()) throw new Error("Sitemap temporarily unavailable.");
}

export async function getSitemapCounts() {
  requireCatalog();
  const { rows } = await dbQuery<{ products: string; categories: string }>(`
    SELECT
      (SELECT count(*) FROM products p WHERE p.status IN ('published', 'low stock') AND NOT p.seo_noindex) AS products,
      (SELECT count(*) FROM categories c WHERE c.status = 'published' AND EXISTS (
        SELECT 1 FROM products p WHERE p.category_id = c.id AND p.status IN ('published', 'low stock')
      )) AS categories
  `);
  return { products: Math.ceil(Number(rows[0]?.products ?? 0) / SITEMAP_PAGE_SIZE), categories: Math.ceil(Number(rows[0]?.categories ?? 0) / SITEMAP_PAGE_SIZE) };
}

export async function getProductSitemapEntries(page: number): Promise<SitemapEntry[]> {
  requireCatalog();
  const { rows } = await dbQuery<{
    id: string; slug: string | null; updated_at: Date | null; image_url: string | null; gallery_image_urls: string[] | null;
  }>(`SELECT p.id::text AS id, p.slug, p.updated_at, p.image_url, p.gallery_image_urls
      FROM products p WHERE p.status IN ('published', 'low stock') AND NOT p.seo_noindex
      ORDER BY p.id ASC LIMIT $1 OFFSET $2`, [SITEMAP_PAGE_SIZE, (page - 1) * SITEMAP_PAGE_SIZE]);
  return rows.flatMap((row) => {
    const path = `/product/${encodeURIComponent(row.slug?.trim() || row.id)}`;
    if (!isIndexablePath(path)) return [];
    const images = [...new Set([row.image_url, ...(row.gallery_image_urls ?? [])].map((src) => absoluteUrl(src ?? undefined)).filter((src): src is string => Boolean(src)))].slice(0, 20);
    return [{ url: `${siteUrl()}${path}`, lastModified: row.updated_at, images }];
  });
}

export async function getCategorySitemapEntries(page: number): Promise<SitemapEntry[]> {
  requireCatalog();
  const { rows } = await dbQuery<{ slug: string; updated_at: Date | null }>(`
    SELECT c.slug, MAX(GREATEST(c.updated_at, p.updated_at)) AS updated_at
    FROM categories c JOIN products p ON p.category_id = c.id AND p.status IN ('published', 'low stock')
    WHERE c.status = 'published'
    GROUP BY c.id ORDER BY c.id ASC LIMIT $1 OFFSET $2
  `, [SITEMAP_PAGE_SIZE, (page - 1) * SITEMAP_PAGE_SIZE]);
  return rows.flatMap((row) => {
    const path = `/category/${encodeURIComponent(row.slug)}`;
    return isIndexablePath(path) ? [{ url: `${siteUrl()}${path}`, lastModified: row.updated_at }] : [];
  });
}
