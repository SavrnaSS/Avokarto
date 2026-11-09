export const SITEMAP_PAGE_SIZE = 1000;
export type SitemapEntry = { url: string; lastModified?: string | Date | null; images?: string[] };

export function escapeXml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[character]!);
}

function modificationDate(value: SitemapEntry["lastModified"]) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? `<lastmod>${date.toISOString()}</lastmod>` : "";
}

export function sitemapUrlset(entries: SitemapEntry[]) {
  const unique = [...new Map(entries.map((entry) => [entry.url, entry])).values()];
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">${unique.map((entry) => `\n<url><loc>${escapeXml(entry.url)}</loc>${modificationDate(entry.lastModified)}${[...new Set(entry.images ?? [])].slice(0, 20).map((url) => `<image:image><image:loc>${escapeXml(url)}</image:loc></image:image>`).join("")}</url>`).join("")}\n</urlset>`;
}

export function sitemapIndex(urls: string[]) {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${[...new Set(urls)].map((url) => `\n<sitemap><loc>${escapeXml(url)}</loc></sitemap>`).join("")}\n</sitemapindex>`;
}

export function sitemapResponse(xml: string, { status = 200, cache = true } = {}) {
  return new Response(xml, { status, headers: {
    "Content-Type": "application/xml; charset=utf-8",
    "Cache-Control": status === 200 && cache ? "public, max-age=300, s-maxage=300" : "no-store",
    "X-Content-Type-Options": "nosniff",
  } });
}

/** A failed catalog read must never become a cached, incomplete 200 sitemap. */
export async function serveSitemap(indexable: boolean, render: () => Promise<string | Response> | string | Response) {
  if (!indexable) return sitemapResponse(sitemapUrlset([]), { cache: false });
  try {
    const result = await render();
    return typeof result === "string" ? sitemapResponse(result) : result;
  }
  catch { return new Response("Sitemap temporarily unavailable.", { status: 503, headers: { "Retry-After": "60", "Cache-Control": "no-store", "Content-Type": "text/plain; charset=utf-8" } }); }
}

export function sitemapPageNumber(value: string) {
  return /^[1-9]\d{0,5}\.xml$/.test(value) ? Number(value.slice(0, -4)) : null;
}
