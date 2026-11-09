import { siteUrl } from "@/lib/seo";
import { INDEXABLE_STATIC_PATHS, isSiteIndexable } from "@/lib/seoRoutes";
import { SELLER_GUIDES } from "@/lib/seo-guides";
import { serveSitemap, sitemapUrlset } from "@/lib/seo-sitemaps";

export const dynamic = "force-dynamic";

export function GET() {
  return serveSitemap(isSiteIndexable(), () => sitemapUrlset([
    ...INDEXABLE_STATIC_PATHS.map((path) => ({ url: `${siteUrl()}${path === "/" ? "" : path}` })),
    ...SELLER_GUIDES.map((guide) => ({ url: `${siteUrl()}/guides/${guide.slug}`, lastModified: guide.updated })),
  ]));
}
