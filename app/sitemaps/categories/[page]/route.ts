import { getCategorySitemapEntries } from "@/lib/backend/seo-sitemaps";
import { isSiteIndexable } from "@/lib/seoRoutes";
import { serveSitemap, sitemapPageNumber, sitemapResponse, sitemapUrlset } from "@/lib/seo-sitemaps";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ page: string }> }) {
  const page = sitemapPageNumber((await params).page);
  if (page === null) return sitemapResponse(sitemapUrlset([]), { status: 404 });
  return serveSitemap(isSiteIndexable(), async () => {
    const entries = await getCategorySitemapEntries(page);
    return sitemapResponse(sitemapUrlset(entries), { status: entries.length ? 200 : 404 });
  });
}
