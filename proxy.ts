import { jwtVerify } from "jose";
import { NextResponse, type NextRequest } from "next/server";
import { isFacetedShopQuery, isIndexablePath, isSiteIndexable } from "@/lib/seoRoutes";
import { resolveStoreDomain } from "@/lib/backend/store-domains";
import { STORE_DOMAIN_HEADER } from "@/lib/storeDomainHeader";

const CORE_DEMO_ROUTES = new Set([
  "/advanced-megamenu",
  "/backorder",
  "/boost-features",
  "/bulk-amount-purchase",
  "/cart-builder",
  "/compare-table-builder",
  "/customize-options",
  "/feature-list",
  "/flash-sell-management",
  "/footer-builder",
  "/free-shipping",
  "/header-builder",
  "/mobile-first",
  "/multi-step-checkout",
  "/notifications",
  "/offer-management",
  "/page-options",
  "/partial-payment",
  "/performance",
  "/popup-builder",
  "/pre-order",
  "/product-display",
  "/product-filtering",
  "/quick-view",
  "/sale-push-notification",
  "/sales-popup",
  "/shareable-cart",
  "/size-chart-builder",
  "/sticky-cart-builder",
  "/stock-progressbar",
  "/variant-switcher",
  "/wishlist-builder",
]);

const OTHER_DEMO_ROUTES = new Set([
  "/about-two",
  "/brand-list",
  "/compare-empty-page",
  "/compare-product",
  "/contact-four",
  "/contact-two",
  "/error-404",
  "/error-maintanance",
  "/faq-page-02",
  "/offer-list-page",
  "/portfolio-details",
]);

const ALLOWED_SHOP_ROUTES = new Set([
  "/shop",
  "/shop-by-brands",
  "/shop-by-categories",
  "/shop-by-category",
]);

const ADMIN_SESSION_COOKIE = "unimart_session";
const ADMIN_SIGN_IN_PATH = "/admin/signin";
const encoder = new TextEncoder();

function normalizePathname(pathname: string) {
  return pathname.replace(/\/+$/, "") || "/";
}

function isLegacyDemoRoute(pathname: string) {
  if (pathname === "/" || pathname === "/home-fashion") return false;

  if (pathname.startsWith("/home-")) return true;
  if (pathname.startsWith("/element-")) return true;
  if (pathname.startsWith("/portfolio-")) return true;
  if (pathname.startsWith("/blog-")) return true;
  if (pathname.startsWith("/team-page-")) return true;
  if (pathname.startsWith("/feature-")) return true;
  if (pathname.startsWith("/categories-style-")) return true;
  if (pathname.startsWith("/products-")) return true;

  // Every /product-single-*/[id] route now fetches a real product from the
  // database and 404s itself when one doesn't exist (see each route's own
  // page.tsx) - none of them are static demo pages anymore, so none should
  // bounce to the homepage here.

  if (pathname.startsWith("/shop-") && !ALLOWED_SHOP_ROUTES.has(pathname)) {
    return true;
  }

  return CORE_DEMO_ROUTES.has(pathname) || OTHER_DEMO_ROUTES.has(pathname);
}

async function hasValidAdminSession(request: NextRequest) {
  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  const secret = process.env.JWT_SECRET?.trim();

  if (!token || !secret || secret.length < 32) {
    return false;
  }

  try {
    const { payload } = await jwtVerify(token, encoder.encode(secret));
    return payload.role === "admin";
  } catch {
    return false;
  }
}

/* ------------------------------------------------------------------------
 * Custom domains for reseller stores
 * --------------------------------------------------------------------- */

// The host the visitor typed (behind a reverse proxy it arrives in
// X-Forwarded-Host).
function requestHost(request: NextRequest) {
  const forwarded = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  return (forwarded || request.headers.get("host") || request.nextUrl.host).toLowerCase();
}

function siteOrigin() {
  try {
    return new URL(process.env.NEXT_PUBLIC_SITE_URL || "").origin;
  } catch {
    return null;
  }
}

// Avokarto's own hosts never need a custom-domain lookup.
function isPlatformHost(host: string) {
  const bare = host.replace(/:\d+$/, "");
  let primary = "";
  try {
    primary = new URL(process.env.NEXT_PUBLIC_SITE_URL || "").hostname;
  } catch { /* unset in some local setups */ }
  return (
    bare === primary ||
    bare === "localhost" ||
    bare === "127.0.0.1" ||
    bare === "[::1]" ||
    bare.endsWith(".localhost")
  );
}

// First path segments that belong to Avokarto itself (admin, accounts,
// selling, the main shop, policies…). On a store domain they redirect to
// the main site instead of being read as a product slug.
const MAIN_SITE_SEGMENT =
  /^(admin|api|sell|seller|signin|signup|forgot-password|account(-[a-z-]+)?|my-[a-z-]+|help-center|wishlist|compare[a-z-]*|about[a-z-]*|contact[a-z-]*|faq[a-z0-9-]*|privacy-policy|return-policy|terms-policy|shop[a-z-]*|products?([a-z-]*)|brand-list|offer-list-page|sellers|marketplace|store-preview|start|splash|social-image|home[a-z-]*|error-[a-z0-9-]+|store|pricing|how-it-works|dropshipping-store-builder|guides|category|sitemaps)$/;

// The cart lives in the store domain's browser storage, so cart and
// checkout must run there too - as the store's own branded pages.
const STORE_FLOW_PATHS = new Set(["/cart", "/checkout", "/checkout/complete"]);

// Avokarto's multi-step checkout URLs (old links, bookmarks) → the store's.
const LEGACY_CHECKOUT_PATHS: Record<string, string> = {
  "/checkout-delivery-step-one": "/checkout",
  "/checkout-delivery-step-two": "/checkout",
  "/checkout-payment": "/checkout",
  "/checkout-shipping": "/checkout",
  "/checkout-thankyou": "/checkout/complete",
};

function customDomainResponse(request: NextRequest, pathname: string, handle: string) {
  // Reseller stores are deliberately noindex. Do not advertise Avokarto's
  // sitemap on an independent domain or send these files to a product route.
  if (pathname === "/robots.txt") {
    return new NextResponse("User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/\nAllow: /api/uploads/\n", { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=300" } });
  }
  if (pathname === "/sitemap.xml" || pathname.startsWith("/sitemaps/")) {
    return new NextResponse('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"/>', { headers: { "Content-Type": "application/xml; charset=utf-8", "X-Robots-Tag": "noindex", "Cache-Control": "public, max-age=300" } });
  }
  const toMainSite = () => {
    const origin = siteOrigin();
    if (!origin) return NextResponse.rewrite(new URL(`/store/${handle}`, request.url));
    // An explicit absolute Location: a relative one would loop on the
    // seller's domain instead of reaching Avokarto.
    return new NextResponse(null, {
      headers: { Location: new URL(`${request.nextUrl.pathname}${request.nextUrl.search}`, origin).toString() },
      status: 307,
    });
  };

  // Old-style links (/store/<this-store>/...) move to the clean URL.
  const storePrefix = `/store/${handle}`;
  if (pathname === storePrefix || pathname.startsWith(`${storePrefix}/`)) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.slice(storePrefix.length) || "/";
    return NextResponse.redirect(url, 308);
  }

  // Serve one of this store's pages at the clean URL the visitor typed.
  const rewriteToStore = (storePath: string) => {
    const url = request.nextUrl.clone();
    url.pathname = `${storePrefix}${storePath}`;
    const headers = new Headers(request.headers);
    headers.set(STORE_DOMAIN_HEADER, handle);
    const response = NextResponse.rewrite(url, { request: { headers } });
    response.headers.set("X-Robots-Tag", "noindex, follow");
    return response;
  };

  const legacy = LEGACY_CHECKOUT_PATHS[pathname];
  if (legacy) {
    const url = request.nextUrl.clone(); // keeps ?order= for the thank-you page
    url.pathname = legacy;
    return NextResponse.redirect(url, 308);
  }
  if (STORE_FLOW_PATHS.has(pathname)) return rewriteToStore(pathname);

  // "/" is the store, "/<product-slug>" a product in it - except Avokarto's
  // own pages, which must never be served (or 404) on a seller's domain.
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length <= 1 && !(segments[0] && MAIN_SITE_SEGMENT.test(segments[0]))) {
    return rewriteToStore(segments.length ? `/${segments[0]}` : "");
  }

  // Admin, accounts, selling, other stores and the main shop live on Avokarto.
  return toMainSite();
}

export async function proxy(request: NextRequest) {
  const pathname = normalizePathname(request.nextUrl.pathname);

  const host = requestHost(request);
  const origin = siteOrigin();
  if (origin && isSiteIndexable()) {
    const primaryHost = new URL(origin).host.toLowerCase();
    const aliasHost = primaryHost.startsWith("www.") ? primaryHost.slice(4) : `www.${primaryHost}`;
    if (host === aliasHost) {
      return NextResponse.redirect(new URL(`${request.nextUrl.pathname}${request.nextUrl.search}`, origin), 308);
    }
  }
  if (!isPlatformHost(host)) {
    // A lookup failure must never take the main site down - fall through.
    const handle = await resolveStoreDomain(host).catch(() => null);
    if (handle) return customDomainResponse(request, pathname, handle);
  }
  let canonicalHost = false;
  try {
    canonicalHost = host === new URL(process.env.NEXT_PUBLIC_SITE_URL || "").host.toLowerCase();
  } catch { /* Missing/invalid launch settings must never enable indexing. */ }
  const noindex = !isSiteIndexable() || !canonicalHost || !isIndexablePath(pathname) ||
    ((pathname === "/shop" || pathname.startsWith("/category/")) && isFacetedShopQuery(request.nextUrl.searchParams));
  const withIndexingPolicy = (response: NextResponse) => {
    if (noindex) response.headers.set("X-Robots-Tag", "noindex, follow");
    return response;
  };

  if (
    pathname.startsWith("/admin") &&
    pathname !== ADMIN_SIGN_IN_PATH &&
    !pathname.startsWith(`${ADMIN_SIGN_IN_PATH}/`) &&
    !(await hasValidAdminSession(request))
  ) {
    const url = request.nextUrl.clone();
    url.pathname = ADMIN_SIGN_IN_PATH;
    url.searchParams.set("next", `${request.nextUrl.pathname}${request.nextUrl.search}`);

    return withIndexingPolicy(NextResponse.redirect(url, 307));
  }

  // /product/:id is the universal product page. It absorbed both
  // /product-single-fashion/:id (renamed) and /product-single-default/:id
  // (retired). Old bookmarks/links/search results should land on the same
  // product, not bounce to the homepage like a genuinely discontinued demo
  // route does below. An id-less legacy URL has no product to show, so it
  // goes to the shop.
  const legacyProductRoute = pathname.match(
    /^\/product-single-(?:fashion|default)(?:\/(.+))?$/,
  );
  if (legacyProductRoute) {
    const url = request.nextUrl.clone();
    url.pathname = legacyProductRoute[1]
      ? `/product/${legacyProductRoute[1]}`
      : "/shop";

    return withIndexingPolicy(NextResponse.redirect(url, 308));
  }

  if (pathname === "/home-fashion") {
    const url = request.nextUrl.clone();
    url.pathname = "/marketplace";
    url.search = "";
    return withIndexingPolicy(NextResponse.redirect(url, 308));
  }

  if (!isLegacyDemoRoute(pathname)) {
    if (request.headers.has(STORE_DOMAIN_HEADER)) {
      // Only the proxy may say "this request came through a store's domain".
      const headers = new Headers(request.headers);
      headers.delete(STORE_DOMAIN_HEADER);
      return withIndexingPolicy(NextResponse.next({ request: { headers } }));
    }
    return withIndexingPolicy(NextResponse.next());
  }

  const url = request.nextUrl.clone();
  url.pathname = "/";
  url.search = "";

  return withIndexingPolicy(NextResponse.redirect(url, 308));
}

export const config = {
  matcher: ["/robots.txt", "/sitemap.xml", "/sitemaps/:path*", "/((?!api|_next/static|_next/image|assets|favicon.ico|.*\\..*).*)"],
};
