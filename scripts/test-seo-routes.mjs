import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import ts from "typescript";

function loadTypeScript(filename, imports = {}) {
  const loadedModule = { exports: {} };
  const { outputText } = ts.transpileModule(readFileSync(new URL(`../${filename}`, import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  runInNewContext(outputText, {
    module: loadedModule,
    exports: loadedModule.exports,
    URL,
    URLSearchParams,
    Response,
    process: { env: {} },
    require(name) {
      if (!(name in imports)) throw new Error(`Unexpected dependency: ${name}`);
      return imports[name];
    },
  });
  return loadedModule.exports;
}

const routes = loadTypeScript("lib/seoRoutes.ts");
const production = {
  NODE_ENV: "production",
  SITE_INDEXABLE: "true",
  NEXT_PUBLIC_SITE_URL: "https://avokarto.com",
};

test("indexing requires an explicit production opt-in and a public HTTPS canonical origin", () => {
  assert.equal(routes.isSiteIndexable(production), true);
  assert.equal(routes.isSiteIndexable({ ...production, VERCEL_ENV: "production" }), true);
  assert.equal(routes.isSiteIndexable({ ...production, CONTEXT: "production" }), true);
  for (const overrides of [
    { SITE_INDEXABLE: undefined }, { SITE_INDEXABLE: "false" }, { SITE_INDEXABLE: "TRUE" },
    { NODE_ENV: "development" }, { NODE_ENV: "test" }, { NEXT_PUBLIC_SITE_URL: undefined },
    { NEXT_PUBLIC_SITE_URL: "not a URL" }, { NEXT_PUBLIC_SITE_URL: "http://avokarto.com" },
    { NEXT_PUBLIC_SITE_URL: "https://secret:password@avokarto.com" },
    { NEXT_PUBLIC_SITE_URL: "https://avokarto.com/shop" },
    { NEXT_PUBLIC_SITE_URL: "https://avokarto.com?preview=true" },
    { NEXT_PUBLIC_SITE_URL: "https://avokarto.com#preview" },
  ]) {
    assert.equal(routes.isSiteIndexable({ ...production, ...overrides }), false, JSON.stringify(overrides));
  }
});

test("preview, local, staging, and tunnel sites remain non-indexable", () => {
  for (const overrides of [
    { VERCEL_ENV: "preview" }, { VERCEL_TARGET_ENV: "staging" },
    { CONTEXT: "deploy-preview" }, { CONTEXT: "branch-deploy" },
    { DEPLOYMENT_ENV: "staging" }, { APP_ENV: "development" },
    ...[
      "localhost", "127.0.0.1", "10.0.0.4", "192.168.0.10", "[::1]", "store.local",
      "staging.avokarto.com", "avokarto-preview.vercel.app", "dev.avokarto.com",
      "preview.avokarto.com", "local-avokarto.trycloudflare.com", "shop.ngrok-free.app",
    ].map((host) => ({ NEXT_PUBLIC_SITE_URL: `https://${host}` })),
  ]) {
    assert.equal(routes.isSiteIndexable({ ...production, ...overrides }), false, JSON.stringify(overrides));
  }
  assert.equal(routes.isSiteIndexable({ ...production, NEXT_PUBLIC_SITE_URL: "https://store.dev" }), true);
});

test("route allowlist covers registered canonical pages and excludes every template/private route", () => {
  const registered = [];
  function visit(directory, segments = []) {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      if (entry.isDirectory()) visit(new URL(`${entry.name}/`, directory), [...segments, entry.name]);
      if (entry.isFile() && entry.name === "page.tsx") {
        registered.push(`/${segments.filter((part) => !part.startsWith("(")).join("/")}`);
      }
    }
  }
  visit(new URL("../app/", import.meta.url));
  for (const pathname of routes.INDEXABLE_STATIC_PATHS) {
    assert.ok(registered.includes(pathname), `${pathname} must have a real page`);
  }
  for (const pathname of registered) {
    const actualPath = pathname.replace(/\[[^\]]+\]/g, "test-product");
    const expected = routes.INDEXABLE_STATIC_PATHS.includes(pathname) || ["/product/[id]", "/category/[slug]", "/guides/[slug]"].includes(pathname);
    assert.equal(routes.isIndexablePath(actualPath), expected, pathname);
  }
  for (const pathname of ["/cart", "/checkout-payment", "/admin", "/api/products", "/splash", "/home-fashion", "/shop-by-category", "/privacy-policy", "/terms-policy", "/return-policy"]) {
    assert.equal(routes.isIndexablePath(pathname), false, pathname);
  }
});

test("canonical product route matching excludes nested, malformed, and faceted URLs", () => {
  assert.equal(routes.isIndexablePath("/product/cozycarry-cats-dogs"), true);
  assert.equal(routes.isIndexablePath("/product/cozycarry-cats-dogs/"), true);
  assert.equal(routes.isIndexablePath("/shop/"), true);
  for (const pathname of ["/product/", "/product/a/reviews", "/product/a%2Fb", "/product/%2E%2E", "/product/%00", "/product/%ZZ", "/shop?q=cat", "https://avokarto.com/shop"]) {
    assert.equal(routes.isIndexablePath(pathname), false, pathname);
  }
});

test("shop facets are noindex while empty filters and campaign tracking are harmless", () => {
  for (const params of [{ q: "cats" }, { category: ["pets"] }, { sortBy: "price" }, { minPrice: "0" }, { page: "0" }, { page: ["1", "2"] }, new URLSearchParams("q=&q=cat")]) {
    assert.equal(routes.isFacetedShopQuery(params), true);
  }
  for (const params of [{}, { page: "1" }, { page: "2" }, { q: "  " }, { category: [] }, { utm_source: "newsletter", gclid: "123" }, new URLSearchParams("utm_campaign=fall")]) {
    assert.equal(routes.isFacetedShopQuery(params), false);
  }
});

const xml = loadTypeScript("lib/seo-sitemaps.ts");
const guides = loadTypeScript("lib/seo-guides.ts");
const origin = production.NEXT_PUBLIC_SITE_URL;

function sitemapService({ configured = true, rows = [], failure } = {}) {
  const queries = [];
  const service = loadTypeScript("lib/backend/seo-sitemaps.ts", {
    "@/lib/seo": {
      siteUrl: () => origin,
      absoluteUrl: (src) => {
        if (!src) return undefined;
        try { const url = new URL(src, `${origin}/`); return /^https?:$/.test(url.protocol) ? url.href : undefined; }
        catch { return undefined; }
      },
    },
    "@/lib/seoRoutes": routes,
    "@/lib/seo-sitemaps": xml,
    "@/lib/backend/db": {
      hasDatabaseConfig: () => configured,
      async dbQuery(sql, params) { queries.push({ sql, params }); if (failure) throw failure; return { rows }; },
    },
  });
  return { ...service, queries };
}

function sitemapRoute(filename, { indexable = true, service = {} } = {}) {
  return loadTypeScript(filename, {
    "@/lib/seo": { siteUrl: () => origin },
    "@/lib/seoRoutes": { ...routes, isSiteIndexable: () => indexable },
    "@/lib/seo-sitemaps": xml,
    "@/lib/seo-guides": guides,
    "@/lib/backend/seo-sitemaps": service,
  });
}

test("pagination has self-canonicals and rejects duplicate, invalid and unbounded page values", () => {
  assert.equal(routes.catalogPagePath("/shop", 1), "/shop");
  assert.equal(routes.catalogPagePath("/category/pets", 2), "/category/pets?page=2");
  for (const value of [undefined, null, "", "1"]) assert.equal(routes.catalogPageNumber(value), 1);
  assert.equal(routes.catalogPageNumber("42"), 42);
  for (const value of ["0", "-1", "1.5", "01", "NaN", "1e4", "9999999", ["2", "3"]]) {
    assert.equal(routes.catalogPageNumber(value), null);
  }
  assert.equal(routes.isFacetedShopQuery(new URLSearchParams("page=2&utm_source=test")), false);
  assert.equal(routes.isFacetedShopQuery(new URLSearchParams("page=1&page=2")), true);
  assert.equal(routes.isFacetedShopQuery(new URLSearchParams("page=2&category=Pets")), true);
});

test("XML escapes URLs and image query strings exactly once, deduplicates URLs and omits invalid dates", () => {
  const entry = { url: `${origin}/product/cat?x=1&y=2`, images: [`${origin}/a.webp?w=1&h=2`], lastModified: "not-a-date" };
  const result = xml.sitemapUrlset([entry, entry]);
  assert.equal((result.match(/<url>/g) || []).length, 1);
  assert.match(result, /x=1&amp;y=2/);
  assert.match(result, /w=1&amp;h=2/);
  assert.doesNotMatch(result, /amp;amp|lastmod/);
  const dated = xml.sitemapUrlset([{ url: origin, lastModified: "2026-09-15T12:30:00Z" }]);
  assert.match(dated, /<lastmod>2026-09-15T12:30:00.000Z<\/lastmod>/);
});

test("large catalogs are split into bounded sitemaps without the former 45,000-product cutoff", async () => {
  const service = sitemapService({ rows: [{ products: "45001", categories: "1001" }] });
  const counts = await service.getSitemapCounts();
  assert.equal(counts.products, 46);
  assert.equal(counts.categories, 2);
  const root = sitemapRoute("app/sitemap.xml/route.ts", { service: { getSitemapCounts: async () => counts } });
  const response = await root.GET();
  assert.equal(response.status, 200);
  const content = await response.text();
  assert.equal((content.match(/<sitemap>/g) || []).length, 49);
  assert.match(content, /products\/46.xml/);
  assert.match(content, /categories\/2.xml/);
  assert.match(content, /pages.xml/);
});

test("product sitemaps use published catalog canonicals, real dates, safe images and stable bound offsets", async () => {
  const service = sitemapService({ rows: [
    { slug: "cozy-cats", id: "a", updated_at: "2026-09-15T12:30:00Z", image_url: "/api/uploads/a.webp", gallery_image_urls: ["/api/uploads/a.webp", "/api/uploads/b.webp?w=1&h=2", "javascript:alert(1)"] },
    { slug: null, id: "catalog-b", updated_at: null, image_url: null },
    { slug: "..", id: "invalid", updated_at: null },
  ] });
  const entries = await service.getProductSitemapEntries(2);
  assert.equal(entries.length, 2);
  assert.equal(entries[0].url, `${origin}/product/cozy-cats`);
  assert.deepEqual([...entries[0].images], [`${origin}/api/uploads/a.webp`, `${origin}/api/uploads/b.webp?w=1&h=2`]);
  assert.equal(entries[1].url, `${origin}/product/catalog-b`);
  assert.deepEqual([...service.queries[0].params], [1000, 1000]);
  assert.match(service.queries[0].sql, /p\.status IN \('published', 'low stock'\)/);
  assert.match(service.queries[0].sql, /NOT p\.seo_noindex/);
  assert.match(service.queries[0].sql, /ORDER BY p\.id ASC LIMIT \$1 OFFSET \$2/);
});

test("category sitemaps omit unpublished and empty categories and use clean URLs", async () => {
  const service = sitemapService({ rows: [{ slug: "pet-costumes", updated_at: "2026-09-15" }] });
  const entries = await service.getCategorySitemapEntries(1);
  assert.equal(entries[0].url, `${origin}/category/pet-costumes`);
  assert.match(service.queries[0].sql, /JOIN products p ON p\.category_id = c\.id/);
  assert.match(service.queries[0].sql, /c\.status = 'published'/);
  assert.match(service.queries[0].sql, /MAX\(GREATEST\(c.updated_at, p.updated_at\)\)/);
});

test("non-indexable deployments return empty, uncached sitemap documents without reading the catalog", async () => {
  const root = sitemapRoute("app/sitemap.xml/route.ts", { indexable: false, service: { getSitemapCounts: () => { throw new Error("must not read"); } } });
  const response = await root.GET();
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.doesNotMatch(await response.text(), /<loc>/);
  assert.equal(root.dynamic, "force-dynamic");
});

test("catalog failures return retryable 503s and never cache an incomplete sitemap or expose secrets", async () => {
  for (const service of [sitemapService({ configured: false }), sitemapService({ failure: new Error("postgres://private-user:secret@database.internal") })]) {
    const root = sitemapRoute("app/sitemap.xml/route.ts", { service });
    const response = await root.GET();
    assert.equal(response.status, 503);
    assert.equal(response.headers.get("cache-control"), "no-store");
    assert.equal(response.headers.get("retry-after"), "60");
    assert.equal(await response.text(), "Sitemap temporarily unavailable.");
  }
});

test("missing and malformed sitemap chunks return 404 rather than successful empty documents", async () => {
  for (const [file, method] of [["products", "getProductSitemapEntries"], ["categories", "getCategorySitemapEntries"]]) {
    const route = sitemapRoute(`app/sitemaps/${file}/[page]/route.ts`, { service: { [method]: async () => [] } });
    for (const page of ["2.xml", "0.xml", "-1.xml", "01.xml", "1", "1000000.xml"]) {
      const response = await route.GET(new Request(origin), { params: Promise.resolve({ page }) });
      assert.equal(response.status, 404, `${file}/${page}`);
      assert.equal(response.headers.get("cache-control"), "no-store");
    }
  }
});

test("static sitemap contains every seller guide and only canonical public routes", async () => {
  const route = sitemapRoute("app/sitemaps/pages.xml/route.ts");
  const response = await route.GET();
  const content = await response.text();
  for (const path of routes.INDEXABLE_STATIC_PATHS) assert.ok(content.includes(`${origin}${path === "/" ? "" : path}</loc>`), path);
  for (const guide of guides.SELLER_GUIDES) assert.ok(content.includes(`/guides/${guide.slug}</loc><lastmod>${guide.updated}T00:00:00.000Z</lastmod>`));
  assert.doesNotMatch(content, /<loc>[^<]*\/(?:admin|cart|checkout|store|signin)(?:[</])/);
});

test("robots advertises only production sitemap and permits uploaded catalog images", () => {
  for (const indexable of [false, true]) {
    const { default: robots, dynamic } = loadTypeScript("app/robots.ts", {
      "@/lib/seo": { siteUrl: () => production.NEXT_PUBLIC_SITE_URL },
      "@/lib/seoRoutes": { isSiteIndexable: () => indexable },
    });
    const result = robots();
    assert.equal(dynamic, "force-dynamic");
    if (!indexable) {
      assert.equal(result.rules.disallow, "/");
      assert.equal(result.sitemap, undefined);
    } else {
      assert.equal(result.sitemap, "https://avokarto.com/sitemap.xml");
      assert.ok(result.rules.allow.includes("/api/uploads/"));
      assert.ok(result.rules.disallow.includes("/api/"));
      assert.equal(result.rules.disallow.includes("/cart"), false, "crawlers need to read the page's noindex directive");
    }
  }
});
