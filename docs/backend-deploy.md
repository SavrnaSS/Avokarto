# Production deployment

This application requires a persistent Node.js server, PostgreSQL, and durable uploaded-image storage. The embedded `/admin` is the production administration surface. The separate admin-template project is a disconnected design reference.

Passing a build or the offline configuration check does not establish that a store can accept payments, send email, or survive a host restart. The checks below distinguish code/configuration verification from the operations that must be verified on the chosen host.

## Current launch limitations

- The homepage's restored benefit-strip copy advertises payment security, a 30-day return window, vouchers, and 24/7 support. Confirm or replace those claims to match the enabled services and approved policies before launch. Restoring the visual design does not implement these benefits; the live (`--indexable`) SEO smoke check continues to flag this unconfirmed copy.
- Checkout records orders as `pending` and `unpaid`, reserves stock, and records the selected payment label. The card, PayPal, and wallet choices are not backed by payment-provider authorization/capture or payment webhooks. Complete that integration before advertising online payment collection; a manual-payment launch requires an explicit business decision and matching checkout UI.
- Uploads are written to `public/uploads` and served by `/api/uploads/[filename]`. An ephemeral filesystem loses these files. Provide persistent writable storage, backups, and a tested restoration procedure. Multiple application instances must share the same files; object storage requires an implementation change.
- Transactional email is best-effort. Without both `RESEND_API_KEY` and `EMAIL_FROM`, confirmations are skipped. Configuration validation cannot verify sender ownership, provider credentials, or actual delivery.
- `db:seed` inserts demonstration catalog/customers/orders and has development bootstrap defaults. Do not run it against a live store. Like `db:migrate` it also loads `.env` (environment variables take precedence), and it refuses any non-local database unless run as `npm run db:seed -- --allow-remote`. Provision a real administrator separately and remove default/demo accounts and records before launch.
- Database TLS currently uses `rejectUnauthorized: false` in the database helper and database scripts. TLS encryption alone does not verify the server certificate chain. Use a protected database network and review verified-certificate support before exposing database traffic to an untrusted network.

The deployment work does not create orders, run migrations, send email, provision accounts, or publish a website automatically.

Guest orders no longer attach themselves to an account just because an email matches. New orders link only to a verified signed-in session. Signup cannot claim historical guest-customer records or overwrite an existing account during a race; retrieving those historical orders requires a separately verified ownership/support flow. Existing records were not changed by this update.

## Runtime and hosting

Use Node.js 22 or 24 consistently for install, build, and runtime. The package engines and deployment check enforce those supported runtime lines. Pin and maintain the Node image/version in your hosting configuration.

Use a persistent process, such as a container or managed persistent Node service. The current PostgreSQL `LISTEN` connection and filesystem uploads are not configured for ephemeral serverless functions. Generic Next.js serverless deployment instructions are not sufficient for this application.

Place the app behind an HTTPS reverse proxy. Forward the correct host/protocol, disable response buffering for `/api/realtime`, and set stream timeouts that allow a persistent SSE connection. Keep the app and database ports private where possible. The realtime route supplies `X-Accel-Buffering: no`, but the host must honor it.

## Production environment

`.env.example` contains local-development defaults and empty credentials. Keep production secrets in the hosting secret manager; never commit them or include secret `.env` files in a Docker build context. If a real credential was ever placed in the template or shared source, revoke/rotate it with its provider. Removing it from the current file does not revoke it.

| Setting | Production use |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Your actual public HTTPS origin, with no path/query/fragment. Set the same value at **build and runtime**; it controls absolute SEO URLs and secure session cookies. |
| `SITE_INDEXABLE` | `false` for local/staging/preview; `true` only for the public live store. Preview guards can still prevent indexing. Provide the intended value at build and runtime. |
| `GOOGLE_SITE_VERIFICATION` / `BING_SITE_VERIFICATION` | Optional ownership-verification meta tokens from your webmaster accounts, supplied at build time. |
| `DATABASE_URL` | A real PostgreSQL URL with credentials and database name; use direct/session-mode connections. |
| `DATABASE_SSL` | `true` for a remote/public database; `false` only for a protected local/private network. Review the certificate-verification limitation above. |
| `JWT_SECRET` | A unique random secret of at least 32 characters; use a secret generator and secret manager. Rotating it invalidates existing sessions. |
| `DATABASE_POOL_MAX` | Optional positive integer, default `10`; each process also uses one shared realtime session. |
| `DATABASE_CONNECTION_TIMEOUT_MS` | Optional positive integer, default `5000`. |
| `ADMIN_SESSION_DAYS` / `CUSTOMER_SESSION_DAYS` | Optional positive integers, defaults `7` / `30`. |
| `RESEND_API_KEY` / `EMAIL_FROM` | Configure together for confirmation email; verify the sender domain with the provider. |
| `EMAIL_REPLY_TO` | Optional monitored reply-to mailbox. |
| `NEXT_PUBLIC_LIGHTGALLERY_LICENSE_KEY` | Configure the appropriate production gallery license at build time. This is public browser configuration, not a secret. |

Session-cookie `Secure` depends on `NEXT_PUBLIC_SITE_URL` starting with `https://`. The real site must also be served over HTTPS; setting the variable alone does not provision TLS.

Supabase direct URLs can require IPv6. If the host only supports IPv4, copy the exact **session pooler** URL from the provider dashboard. The Supabase transaction pooler on port `6543` is unsuitable for the persistent `LISTEN/NOTIFY` connection. Budget query sessions plus one listener per Node process across all running replicas and maintenance jobs.

## Verification before release

Install from the committed lockfile using the supported Node runtime:

```bash
npm ci
npm run deploy:env
npm run deploy:check
npm run audit:production
```

`deploy:env` loads the production Next.js environment-file precedence (`.env.production.local`, `.env.local`, `.env.production`, `.env`; exported values take priority). It performs no network requests or filesystem/database writes, and prints only setting names and remediation, never supplied values. It fails on missing/unsafe required configuration and reports optional-feature warnings plus manual launch checks. Local development settings are expected to fail the production gate.

`deploy:check` runs that configuration gate, ESLint, the shipping/resource/deployment/SEO regression suites, and the production build. The build includes TypeScript validation. `npm run typecheck` is available separately. `audit:production` is a separate network-dependent registry advisory check; investigate any failure before release. Neither an empty advisory result nor passing tests is a security certification.

`NEXT_PUBLIC_*` settings are compiled into browser assets. Set the intended public origin/license when building the release, and rebuild after changing them. Do not build with a secret development `.env` accidentally copied into the image. Use the same public origin/indexing settings in the runtime environment.

## Database and first administrator

Back up the database before a release that changes schema. Run migrations once per environment from an application checkout or a dedicated migration image with the production environment injected:

```bash
npm run db:migrate
```

The migration script reads process environment variables and, if present, the `.env` file in the working directory; variables already set in the environment take precedence over `.env`. It does not load other Next.js env files (`.env.local`, `.env.production`). Check which database `.env` points at before running it locally. In production, use the host's secret injection, or deliberately invoke `node --env-file=/secure/path/production.env scripts/db-migrate.mjs` on a supported Node runtime. Do not place a literal database password in a command that will be saved in shell history or logs.

`schema_migrations` records applied migrations. Confirm all intended migrations completed before starting the new release. Provision the administrator through a controlled administrative process with a unique strong password; the demo seed is not a production bootstrap workflow. Confirm at least one active shipping method and the intended catalog/settings. The `$100 USD` free-shipping policy uses merchandise value after supported bundle discounts and still requires a valid active method.

`/api/health` checks only that `SELECT 1` succeeds. It does not prove that migrations, catalog tables, payment processing, uploads, or email are configured. A production check should verify those separately.

## Container deployment

Review `Dockerfile`, `.dockerignore`, and `docker-compose.yml` before building. Public settings must be supplied as build arguments/environment; database/JWT/email credentials belong in runtime secret injection. Mount persistent storage at `/app/public/uploads` and back up both it and PostgreSQL. An uploads volume initially hides files at its mount location, so transfer existing uploaded images deliberately when moving a store.

The Dockerfile explicitly includes the migration scripts and SQL in its non-root standalone runtime, but no development toolchain. It excludes local environment files, generated builds, and uploaded files from the build context. Compose keeps PostgreSQL off public ports and binds the app to the host's loopback interface for an HTTPS reverse proxy. It persists PostgreSQL and uploads separately.

With real public build settings and runtime secrets configured in the host's protected environment:

```bash
docker compose build --pull
docker compose up -d
docker compose exec app node scripts/db-migrate.mjs
```

Do not connect public traffic until migrations and administrator provisioning are complete. The Compose PostgreSQL password is interpolated into a connection URL; use a URL-safe generated password (for example, random hex), or supply a correctly encoded connection URL in a customized deployment. Do not run the demo seed as part of container startup. The Docker daemon is not installed in the development workspace, so the actual container build/start must be tested on your target host.

## HTTPS and seller custom domains (Caddy)

`docker-compose.yml` includes a `caddy` service configured by `deploy/caddy/Caddyfile`. It serves the main site over HTTPS. It also issues certificates **on demand** for reseller custom domains (for example `shop.theirbrand.com`), but only after asking the app whether the domain is a verified store domain.

How it fits together:

1. A seller connects a domain in **Seller dashboard → Store settings → Custom domain**. They create a TXT record that proves ownership and a CNAME that points at `STORE_DOMAIN_TARGET`, then press *Check DNS*. Only then is the domain `active`.
2. The first HTTPS visit to that domain reaches Caddy. Before requesting a certificate, Caddy calls `GET http://app:3000/api/domains/tls-check?domain=<host>`.
3. The app answers `200` only for active domains of active stores, and `404` for everything else. Caddy obtains and renews certificates only for approved hosts, so random hostnames pointed at your server never trigger certificate requests.
4. `proxy.ts` routes the request to the store (`/` is the store, `/<product>` is a product). Admin, account and main-shop paths redirect to `NEXT_PUBLIC_SITE_URL`.

### Setup

1. **DNS for your own hosts.** Point the main site host (`SITE_DOMAIN`) at the server with A/AAAA records. Do the same for the CNAME target you give sellers, if it differs, for example `stores.yourshop.com`.
2. **Environment** (in the `.env` next to `docker-compose.yml`):

   | Variable | Example | Purpose |
   | --- | --- | --- |
   | `SITE_DOMAIN` | `www.yourshop.com` | Main site host Caddy serves (no `https://`). Must match `NEXT_PUBLIC_SITE_URL`. |
   | `ACME_EMAIL` | `ops@yourshop.com` | Certificate-expiry notices from Let's Encrypt. |
   | `STORE_DOMAIN_TARGET` | `stores.yourshop.com` | What sellers point their CNAME at. Defaults to the `NEXT_PUBLIC_SITE_URL` host. |
   | `ACME_CA` | *(unset)* | Leave unset for production. While testing, use Let's Encrypt staging: `https://acme-staging-v02.api.letsencrypt.org/directory`. |

3. **Firewall.** Open ports 80 and 443 (TCP) and 443 (UDP, for HTTP/3) to the internet. Port 80 is required for ACME HTTP-01 challenges. Keep 3000 and 5432 private.
4. **Start:** `docker compose up -d`. Caddy obtains the main site's certificate within seconds. Watch it with `docker compose logs -f caddy`.

Certificates and ACME keys live in the `caddy-data` volume. Never delete it casually: re-issuing every certificate after each restart quickly hits [Let's Encrypt rate limits](https://letsencrypt.org/docs/rate-limits/). Back it up with the database.

**Without Docker:** run Caddy on the host with the same Caddyfile and `APP_UPSTREAM=127.0.0.1:3000`. Caddy must forward the visitor's original `Host` header, which it does by default; the app routes custom domains by it.

### Verify

- `curl -I https://$SITE_DOMAIN` returns `200`/`307` with a valid certificate.
- `curl "http://127.0.0.1:3000/api/domains/tls-check?domain=example.org"` returns `404`. An active seller domain returns `200`.
- With a test domain connected and verified, the first `https://` visit takes a few seconds while the certificate is issued, and later visits are instant. Run this first against the staging CA (`ACME_CA`): browsers will warn about the staging certificate, which is expected, and switch `ACME_CA` back afterwards.
- Live updates still stream through Caddy. The admin product list should update without a reload.

### Troubleshooting

| Symptom | Likely cause |
| --- | --- |
| Seller domain shows a TLS/handshake error | Domain not `active` yet (seller hasn't passed *Check DNS*), or the store is suspended. Check `tls-check` for that host. |
| `ask` errors in Caddy logs | The app isn't reachable at `APP_UPSTREAM`, or it's still starting. Check `docker compose ps` and `/api/health`. |
| Main-site certificate never issues | DNS for `SITE_DOMAIN` doesn't point at this server, or port 80 is blocked. |
| Custom domain shows the main shop, not the store | The proxy is not forwarding the original `Host` header (custom Caddy configs must not override `header_up Host`). |

## After deployment

Verify HTTPS redirects and session cookies, `/api/health`, public catalog/product pages, uploaded images after restart, live updates after reconnect, and the configured shipping policy. Use an isolated payment-provider sandbox for payment tests; do not place real customer orders as a deployment smoke test.

Check canonical/social URLs use the real origin; staging/private pages remain `noindex`; and the live `robots.txt`/`sitemap.xml` contain the intended public URLs. Verify the domain in search-console tools and submit the sitemap only after launch. Metadata and a sitemap enable discovery but do not guarantee indexing or search ranking.

Run the read-only HTTP smoke checks against a running preview (`npm run seo:check -- http://localhost:3000`) or the public live HTTPS origin (`npm run seo:check -- https://YOUR-ACTUAL-DOMAIN --indexable`). A populated catalog is required. These check server-rendered product links, metadata/schema, headings, 404s, redirects, crawl controls, and the social image without submitting an order or form. Review and approve privacy, terms, and return policies before launch; those unapproved pages are currently excluded from search.

Keep database/upload backups, monitor server and email-provider failures, and retain a rollback release. Offline validation cannot replace these host-specific checks.
