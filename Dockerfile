# Keep the supported LTS image current with docker build --pull.
ARG NODE_VERSION=24-bookworm-slim
FROM node:${NODE_VERSION} AS dependencies
WORKDIR /app
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci --no-audit --no-fund

FROM node:${NODE_VERSION} AS builder
WORKDIR /app
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .
# Only public build-time settings belong in image layers. Database/API/auth
# secrets are injected at runtime, never passed as build arguments.
ARG NEXT_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_LIGHTGALLERY_LICENSE_KEY=""
ARG SITE_INDEXABLE=false
ARG GOOGLE_SITE_VERIFICATION=""
ARG BING_SITE_VERIFICATION=""
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 NEXT_STANDALONE=1
ENV NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL} \
    NEXT_PUBLIC_LIGHTGALLERY_LICENSE_KEY=${NEXT_PUBLIC_LIGHTGALLERY_LICENSE_KEY} \
    SITE_INDEXABLE=${SITE_INDEXABLE} \
    GOOGLE_SITE_VERIFICATION=${GOOGLE_SITE_VERIFICATION} \
    BING_SITE_VERIFICATION=${BING_SITE_VERIFICATION}
RUN node -e 'const u = new URL(process.env.NEXT_PUBLIC_SITE_URL); if (u.protocol !== "https:" || u.pathname !== "/" || u.username || u.password || u.search || u.hash) throw new Error("Set a public HTTPS origin in NEXT_PUBLIC_SITE_URL before building");'
RUN npm run build

FROM node:${NODE_VERSION} AS runner
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME="0.0.0.0"
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
COPY --from=builder --chown=node:node /app/public ./public
# Explicit one-off migration/seed commands; never mutate the database on boot.
COPY --from=builder --chown=node:node /app/scripts/db-migrate.mjs /app/scripts/db-seed.mjs ./scripts/
COPY --from=builder --chown=node:node /app/database ./database
RUN mkdir -p public/uploads .next/cache && chown -R node:node public/uploads .next/cache
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=6s --start-period=30s --retries=3 \
  CMD node -e 'fetch("http://127.0.0.1:" + (process.env.PORT || 3000) + "/api/health", {signal: AbortSignal.timeout(5000)}).then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))'
CMD ["node", "server.js"]
