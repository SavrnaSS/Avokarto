import { getSitemapCounts } from "@/lib/backend/seo-sitemaps";
import { siteUrl } from "@/lib/seo";
import { isSiteIndexable } from "@/lib/seoRoutes";
import { serveSitemap, sitemapIndex } from "@/lib/seo-sitemaps";

export const dynamic = "force-dynamic";

export function GET() {
  return serveSitemap(isSiteIndexable(), async () => {
    const counts = await getSitemapCounts();
    return sitemapIndex([
      `${siteUrl()}/sitemaps/pages.xml`,
      ...Array.from({ length: counts.products }, (_, index) => `${siteUrl()}/sitemaps/products/${index + 1}.xml`),
      ...Array.from({ length: counts.categories }, (_, index) => `${siteUrl()}/sitemaps/categories/${index + 1}.xml`),
    ]);
  });
}
