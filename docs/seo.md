# Production SEO

The public website covers the seller platform and the shopping catalog. All
indexable pages have a canonical URL, a distinct title and description, social
metadata and a server-rendered page heading. Keep the public origin and indexing
flag consistent at build and runtime.

## Public pages

- `/` explains the platform and publishes WebPage, WebApplication and FAQPage
  structured data. The visible FAQ and its schema share `lib/seller-faq.ts`.
- `/pricing` uses the same plan definitions as the builder and billing UI in
  `lib/billing/plans.ts`. The social card also uses these plan definitions.
- `/how-it-works`, `/dropshipping-store-builder` and `/guides` describe the
  product and link to original seller guides. Guides have article metadata,
  attribution, real publication dates, a table of contents and related links.
- `/shop` and `/category/[slug]` render the first 24 products on the server.
  Later pages use `?page=2` with their own canonical, heading, product links
  and previous/next navigation. The first page retains the live catalog UI.
- Category links in navigation, category tiles and product breadcrumbs use
  the published category slug. `/shop-by-category` and `/categories-list`
  permanently redirect to `/shop-by-categories`.
- `/product/[slug]` retains catalog SEO overrides, image alt text, gallery
  images, real prices and stock, validated identifiers and approved customer
  review schema. Retired slugs and identifier aliases redirect permanently.

Empty category pages are noindex. Missing products, categories, guides and
out-of-range catalog pages return 404. Searches and filters remain noindex;
ordinary pagination is indexable. Account, admin, cart, checkout and builder
steps remain excluded. Legal-policy indexing remains subject to the existing
publication policy. Reseller storefronts retain their existing noindex policy;
their custom-domain crawl files never advertise the platform's sitemap.

## Sitemaps and crawl controls

Submit `/sitemap.xml`. It is a sitemap index with:

- `/sitemaps/pages.xml`: canonical public pages and seller guides.
- `/sitemaps/products/1.xml`, `2.xml`, etc.: published, indexable products
  and their images, in groups of 1,000.
- `/sitemaps/categories/1.xml`, `2.xml`, etc.: published, nonempty categories,
  in groups of 1,000.

Chunks use a stable database order and bound limits/offsets. There is no
45,000-product truncation. Dates come from catalog records or actual guide
updates. XML escapes URLs and image query parameters once. Database failures
return 503 with `Retry-After: 60` and `Cache-Control: no-store`, rather than
publishing an incomplete sitemap. Missing chunks return an uncached 404.
Successful sitemaps can be cached for five minutes.

`robots.txt` advertises the index only when `isSiteIndexable()` accepts the
environment. Uploaded product images remain crawlable. Page-level noindex and
response headers protect private routes and noncanonical preview hosts. The
www/non-www alias redirects permanently to the configured canonical host.

## Deployment

1. Set `NEXT_PUBLIC_SITE_URL` to the actual public HTTPS origin, without a
   path, query, credentials or fragment. Build with the same value.
2. Keep `SITE_INDEXABLE=false` on development, staging and previews. Set it
   to `true` only in the public production deployment. The guards also check
   deployment context and reject staging, local and tunnel origins.
3. Set `GOOGLE_SITE_VERIFICATION` and/or `BING_SITE_VERIFICATION` to the
   ownership tokens from your webmaster accounts, then rebuild.
4. Deploy the application, verify the public origin, and submit
   `https://YOUR-DOMAIN/sitemap.xml` in Google Search Console and Bing
   Webmaster Tools. These account actions require the site's owner.

Changing the local environment does not configure the production host. Search
rankings and rich-result eligibility depend on the search engine; valid markup
does not guarantee either. In particular, FAQ markup is not a promise of a FAQ
rich result. Product ratings are emitted only from approved customer reviews.

## Verification

```sh
npm run typecheck
npm test
npm run build
npm run seo:check:render
npm run seo:check -- http://localhost:3000
# After deployment, against the actual production origin:
npm run seo:check -- https://YOUR-DOMAIN --indexable
```

The HTTP check is read-only. It checks server HTML, headings, canonicals,
metadata, product/category discovery, pagination, schema, redirects, 404s,
sitemap children, robots and the social image. Use a populated catalog.

The render check uses the real production build with an isolated, read-only
catalog fixture and no listening port. It verifies page-two contents, genuine
404 status codes for visitors and Googlebot, canonical redirects and the social
image. It does not access or write to the real database. Catalog validation runs
before streaming; placing a `loading.tsx` above these pages would otherwise
turn missing categories and out-of-range pages into HTTP 200 responses.

For a public deployment, inspect a homepage, guide, category and product URL
in Search Console, and validate their schema with the Rich Results Test.
Monitor indexing reports and Core Web Vitals using real traffic after launch.

References: [Google's ecommerce site structure guidance](https://developers.google.com/search/docs/specialty/ecommerce/help-google-understand-your-ecommerce-site-structure),
[ecommerce URL guidance](https://developers.google.com/search/docs/specialty/ecommerce/designing-a-url-structure-for-ecommerce-sites),
[sitemaps](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap),
[product structured data](https://developers.google.com/search/docs/appearance/structured-data/product).
