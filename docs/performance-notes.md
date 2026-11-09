# Storefront performance

Performance improvements verified locally on 2026-09-25:

- Responsive hero, category, banner, and product-swatch image sizes. Only the first hero image is preloaded; remaining images use normal lazy loading.
- Header search content loads when opened, avoiding hidden product grids and their subscriptions during page startup.
- Product action buttons and header counters subscribe only to the store values they display. Closed search panels no longer update the UI store on every scroll; the scroll indicator batches work with animation frames.
- Concurrent requests responding to the same realtime event share one read. Each later event gets a new freshness scope; completed inventory/price results are not cached. Manual refresh and cancellation retain their behavior.
- Previous/next product lookup uses one database round trip.
- Generated Font Awesome CSS retains referenced icon mappings and every general rule/font declaration. Original vendor CSS and font files remain available.

## Measurements

Fresh Chromium contexts, 1440×900 desktop and 390×844 mobile, device scale factor 1, localhost development server, 12 seconds of observation after load:

| Measurement | Before | After |
| --- | ---: | ---: |
| Mobile resource payload (encoded bodies) | 11.52 MB | 7.23 MB |
| Mobile optimized-image payload | 3.59 MB | 0.48 MB |
| Hero image preloads | 6 | 1 |
| Icon stylesheet, gzip | 79.6 KB | 7.6 KB |
| Warm adjacent-product API median | ~602 ms | ~320 ms |

These are local samples, not production benchmarks. Development compilation, hot reload, database connection warmup, and browser caching affect timings. First-paint timings varied; the most consistent improvements were smaller transfers and fewer unnecessary updates. Image quality, page structure, and catalog freshness are preserved.

Verification passed: production build and TypeScript, all five resource-request regression tests, icon preservation/currentness checks, desktop search, and desktop/mobile wishlist, comparison, quick view, cart persistence, and product navigation. Mobile menu open/close also passed. Browser checks reported no runtime errors or horizontal page overflow. ESLint finished with zero errors and one pre-existing unused `hasAdjacentProducts` warning in `components/product-details/BreadCrumb.tsx`.

## Maintenance and checks

`npm run dev`, `npm run dev:turbo`, `npm run build`, and `npm run analyze` regenerate the icon stylesheet automatically. After adding an icon during an already-running development session, run `npm run icons:generate`. Keep complete icon class names in source; externally generated names must be listed in `additionalIconClasses` in `scripts/generate-icon-css.mjs` or use the original stylesheet on that surface.

- `npm run icons:check` verifies the generated stylesheet is current.
- `node scripts/test-resource-requests.mjs` checks request sharing, freshness, cancellation, and realtime reconnects.
- `npm run lint` and `npm run build` check the application.

For a production build alongside the running default dev server, the existing `NEXT_DEV_SIDE_INSTANCE=1` configuration writes to `.next-dev` and avoids overwriting the active server's output.
