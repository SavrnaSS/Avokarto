// Read-only HTTP checks against an already running instance. Never submits forms.
import assert from "node:assert/strict";

const origin = new URL(process.argv.find((arg) => /^https?:\/\//.test(arg)) || "http://localhost:3000").origin;
const expectIndexable = process.argv.includes("--indexable");
const stripScripts = (html) => html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "");
const meta = (html, name) => [...html.matchAll(/<meta\b[^>]*>/gi)].find(([tag]) => tag.includes(`name="${name}"`))?.[0] || "";
const canonical = (html) => [...html.matchAll(/<link\b[^>]*>/gi)].find(([tag]) => tag.includes('rel="canonical"'))?.[0].match(/href="([^"]+)"/)?.[1];
async function read(path) {
  const response = await fetch(`${origin}${path}`, { redirect: "manual", signal: AbortSignal.timeout(45000) });
  return { response, html: await response.text() };
}
function checkPage(path, response, html) {
  assert.equal(response.status, 200, `${path} status`);
  const body = stripScripts(html);
  assert.equal((body.match(/<h1\b/gi) || []).length, 1, `${path} has one page heading`);
  assert.ok(meta(body, "description"), `${path} description`);
  assert.ok(canonical(body), `${path} canonical`);
  const actualCanonical = new URL(canonical(body));
  const expectedCanonical = new URL(path, origin);
  assert.equal((actualCanonical.pathname.replace(/\/$/, "") || "/") + actualCanonical.search, (expectedCanonical.pathname.replace(/\/$/, "") || "/") + expectedCanonical.search, `${path} canonical path`);
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  // The original benefits design can be previewed locally, but its promises
  // must be backed by approved policies/services before an indexable launch.
  if (path === "/" && expectIndexable) {
    assert.doesNotMatch(body, /Encrypted payment flow|Return money within 30 days|20% off when you shop online|24\/7 online feedback|LIMITED 50% OFF|SALE UP TO 50%/, "homepage must not advertise unconfigured template promises");
  }
  if (expectIndexable) {
    assert.doesNotMatch(meta(body, "robots"), /noindex/);
    assert.doesNotMatch(response.headers.get("x-robots-tag") || "", /noindex/);
    assert.equal(new URL(canonical(body)).origin, origin, "live canonical must match checked public origin");
  } else {
    assert.match(response.headers.get("x-robots-tag") || "", /noindex/, "preview/local must not be indexed");
  }
}

for (const path of ["/", "/about", "/contact", "/faq-page-01", "/help-center", "/shop-by-categories", "/pricing", "/how-it-works", "/dropshipping-store-builder", "/guides"]) {
  const { response, html } = await read(path);
  checkPage(path, response, html);
  console.log(`PASS ${path}: heading, description, canonical, indexing and security header`);
}

const guideIndex = await read("/guides");
const guidePath = stripScripts(guideIndex.html).match(/href="(\/guides\/[^"?]+)"/)?.[1];
assert.ok(guidePath, "guides must be discoverable in the HTML");
const guide = await read(guidePath);
checkPage(guidePath, guide.response, guide.html);
assert.match(guide.html, /"@type":"Article"/);
assert.match(guide.html, /"datePublished":/);
console.log("PASS seller content: pricing, builder, guide discovery and Article schema");

const shop = await read("/shop");
checkPage("/shop", shop.response, shop.html);
const productPath = stripScripts(shop.html).match(/href="(\/product\/[^"?]+)"/)?.[1];
assert.ok(productPath, "the shop must contain crawlable product links before JavaScript runs");
const detail = await read(productPath);
checkPage(productPath, detail.response, detail.html);
const graphs = [...detail.html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)]
  .flatMap(([, value]) => { const data = JSON.parse(value); return data["@graph"] || [data]; });
const product = graphs.find((entry) => entry["@type"] === "Product" && entry.offers?.priceCurrency === "USD");
assert.ok(product);
assert.ok(graphs.some((entry) => entry["@type"] === "BreadcrumbList"));
if (product.sku && productPath !== `/product/${encodeURIComponent(product.sku)}`) {
  const skuAlias = await read(`/product/${encodeURIComponent(product.sku)}`);
  assert.equal(skuAlias.response.status, 308, "SKU aliases must permanently redirect before streaming");
  assert.equal(new URL(skuAlias.response.headers.get("location"), origin).pathname, productPath);
}
console.log("PASS shop/product: server-rendered catalog, Product and Breadcrumb structured data");

const categoryPath = stripScripts(shop.html).match(/href="(\/category\/[^"?]+)"/)?.[1];
assert.ok(categoryPath, "the shop must contain canonical category links before JavaScript runs");
const category = await read(categoryPath);
checkPage(categoryPath, category.response, category.html);
assert.match(category.html, /"@type":"CollectionPage"/);
assert.ok(stripScripts(category.html).match(/href="\/product\//));
if (stripScripts(shop.html).includes('href="/shop?page=2"')) {
  const next = await read("/shop?page=2");
  checkPage("/shop?page=2", next.response, next.html);
  assert.ok(stripScripts(next.html).includes('rel="prev"'));
  assert.ok(stripScripts(next.html).match(/href="\/product\//));
}
const overflow = await read("/shop?page=999999");
assert.equal(overflow.response.status, 404, "an out-of-range catalog page is a real 404");
console.log("PASS category pages, collection schema and crawlable catalog pagination");

const search = await read("/shop?q=cat");
assert.match(meta(search.html, "robots"), /noindex/);
assert.equal(new URL(canonical(search.html)).pathname, "/shop");
const missing = await read("/product/seo-smoke-nonexistent-product-849210");
assert.match(meta(missing.html, "robots"), /noindex/);
assert.equal(missing.response.status, 404, "missing products must return HTTP 404");
const alias = await read("/home-fashion");
assert.equal(alias.response.status, 308);
const cart = await read("/cart");
assert.match(cart.response.headers.get("x-robots-tag") || "", /noindex/);
console.log("PASS search, missing products, aliases, and private-page indexing");

const robots = await read("/robots.txt");
assert.equal(robots.response.status, 200);
const sitemap = await read("/sitemap.xml");
assert.equal(sitemap.response.status, 200);
if (expectIndexable) {
  assert.ok(robots.html.includes(`Sitemap: ${origin}/sitemap.xml`));
  assert.match(sitemap.html, /<sitemapindex\b/);
  const sitemapUrls = [...sitemap.html.matchAll(/<loc>([^<]+)<\/loc>/g)].map(([, url]) => url.replace(/&amp;/g, "&"));
  const productSitemap = sitemapUrls.find((url) => url.endsWith("/sitemaps/products/1.xml"));
  const categorySitemap = sitemapUrls.find((url) => url.endsWith("/sitemaps/categories/1.xml"));
  assert.ok(productSitemap && categorySitemap, "the index advertises product and category sitemaps");
  for (const url of [productSitemap, categorySitemap, `${origin}/sitemaps/pages.xml`]) {
    assert.equal(new URL(url).origin, origin);
    const child = await read(new URL(url).pathname);
    assert.equal(child.response.status, 200);
    assert.match(child.html, /<urlset\b/);
    assert.match(child.html, /<loc>/);
  }
} else {
  assert.match(robots.html, /Disallow: \/(?:\r?\n|$)/);
  assert.doesNotMatch(sitemap.html, /<loc>/);
}
const image = await fetch(`${origin}/social-image`, { signal: AbortSignal.timeout(45000) });
assert.equal(image.status, 200);
assert.match(image.headers.get("content-type"), /image\/png/);
const bytes = Buffer.from(await image.arrayBuffer());
assert.equal(bytes.readUInt32BE(16), 1200);
assert.equal(bytes.readUInt32BE(20), 630);
console.log("PASS robots, sitemap, and 1200×630 social image");
