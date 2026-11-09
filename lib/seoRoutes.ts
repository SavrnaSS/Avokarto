/** Only canonical pages with real storefront content belong in search. */
export const INDEXABLE_STATIC_PATHS = [
  "/",
  "/marketplace",
  "/shop",
  "/shop-by-categories",
  "/about",
  "/contact",
  "/faq-page-01",
  "/help-center",
  "/pricing",
  "/how-it-works",
  "/dropshipping-store-builder",
  "/guides",
] as const;

const indexablePaths = new Set<string>(INDEXABLE_STATIC_PATHS);

export function isIndexablePath(pathname: string) {
  if (!pathname.startsWith("/") || /[?#]/.test(pathname)) return false;
  const path = pathname.replace(/\/+$/, "") || "/";
  if (indexablePaths.has(path)) return true;
  const content = path.match(/^\/(?:product|category|guides)\/([^/]+)$/);
  if (!content) return false;
  try {
    const identifier = decodeURIComponent(content[1]);
    return Boolean(identifier.trim()) && !/[\\/\u0000-\u001f]/.test(identifier) && identifier !== "." && identifier !== "..";
  } catch {
    return false;
  }
}

const shopFilterKeys = new Set([
  "q", "query", "search", "category", "categories", "brand", "brands", "color",
  "size", "minprice", "maxprice", "price", "sort", "sortby", "tag", "tags",
]);

/** A real, bounded catalog page. Duplicate/malformed page parameters aren't aliases. */
export function catalogPageNumber(value: string | string[] | undefined | null): number | null {
  if (value === undefined || value === null || value === "") return 1;
  if (Array.isArray(value) || !/^[1-9]\d{0,5}$/.test(value)) return null;
  return Number(value);
}

export function catalogPagePath(path: string, page: number) {
  return page === 1 ? path : `${path}?page=${page}`;
}

export function isFacetedShopQuery(
  params: URLSearchParams | Record<string, string | string[] | undefined>,
) {
  const entries = params instanceof URLSearchParams ? params.entries() : Object.entries(params);
  if (params instanceof URLSearchParams) {
    const pages = params.getAll("page");
    if (pages.length > 1 || catalogPageNumber(pages[0]) === null) return true;
  } else if (catalogPageNumber(params.page) === null) return true;
  for (const [key, value] of entries) {
    if (!shopFilterKeys.has(key.toLowerCase())) continue;
    if ((Array.isArray(value) ? value : [value]).some((item) => Boolean(item?.trim()))) return true;
  }
  return false;
}

type SiteEnvironment = Record<string, string | undefined>;

/** Default closed: indexing is an explicit production deployment choice. */
export function isSiteIndexable(env: SiteEnvironment = process.env) {
  if (env.SITE_INDEXABLE !== "true" || env.NODE_ENV !== "production") return false;
  for (const key of ["VERCEL_ENV", "VERCEL_TARGET_ENV", "CONTEXT", "DEPLOYMENT_ENV", "APP_ENV"]) {
    const deployment = env[key]?.trim().toLowerCase();
    if (deployment && deployment !== "production") return false;
  }
  try {
    const configured = env.NEXT_PUBLIC_SITE_URL?.trim();
    if (!configured) return false;
    const url = new URL(configured);
    if (
      url.protocol !== "https:" || url.username || url.password || url.search || url.hash ||
      (url.pathname !== "/" && url.pathname !== "")
    ) return false;

    const hostname = url.hostname.toLowerCase().replace(/\.$/, "");
    if (
      !hostname.includes(".") || hostname.startsWith("[") || /^[\d.]+$/.test(hostname) ||
      /\.(?:localhost|local|test|invalid|example)$/.test(hostname) ||
      /(?:^|\.)(?:trycloudflare\.com|ngrok-free\.app|ngrok\.io|localtunnel\.me)$/.test(hostname)
    ) return false;

    // Reject a configured staging/preview origin even if its runtime is built
    // in production mode. Request hosts must also be checked by the proxy.
    return !hostname.split(".").slice(0, -1).some((label) =>
      /(?:^|-)(?:dev|development|test|testing|stage|staging|preview|pr-\d+)(?:-|$)/.test(label),
    );
  } catch {
    return false;
  }
}
