# ═══════════════════════════════════════════════════════════════════
# NexoraOS™ — Multi-Stage Dockerfile
# ═══════════════════════════════════════════════════════════════════

# ─── Stage 1: All Dependencies (for build) ────────────────────
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --ignore-scripts && npm cache clean --force

# ─── Stage 2: Production Dependencies Only ─────────────────────
FROM node:20-alpine AS deps-prod
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force

# ─── Stage 3: Build ───────────────────────────────────────────
FROM node:20-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ─── Stage 4: Production ──────────────────────────────────────
FROM node:20-alpine AS production
RUN apk add --no-cache dumb-init wget
RUN addgroup -g 1001 -S nexora && adduser -S nexora -u 1001 -G nexora

WORKDIR /app

COPY --from=deps-prod /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/package.json ./
COPY --from=build /app/migrations ./migrations
COPY public ./public

ENV NODE_ENV=production
ENV PORT=3000

USER nexora

EXPOSE 3000

# Canonical health endpoint — must match render.yaml healthCheckPath
HEALTHCHECK --interval=30s --timeout=10s --retries=3 --start-period=30s \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/v2/health/liveness || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/server.cjs"]
