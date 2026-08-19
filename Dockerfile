# NexoraOS™ — Dockerfile (Multi-stage production build)
# Builds the Vite frontend + Express backend into a single image

# ═══ Stage 1: Build Frontend ═══════════════════════════════
FROM node:20-alpine AS frontend-build

WORKDIR /app

# Install frontend dependencies
COPY package.json package-lock.json* ./
RUN npm ci --ignore-scripts

# Copy frontend source and build
COPY src/ src/
COPY index.html vite.config.ts tailwind.config.* postcss.config.* ./
COPY tsconfig*.json ./
RUN npm run build

# ═══ Stage 2: Build Backend ═══════════════════════════════
FROM node:20-alpine AS backend-build

WORKDIR /app

# Install all dependencies (including devDependencies for build)
COPY package.json package-lock.json* ./
RUN npm ci --ignore-scripts

# Copy server source
COPY src/server/ src/server/
COPY src/db/ src/db/

# Build backend with esbuild
RUN npx esbuild src/server/server.ts \
  --bundle --platform=node --format=cjs \
  --packages=external --sourcemap \
  --outfile=dist/server.cjs

# ═══ Stage 3: Production Image ═════════════════════════════
FROM node:20-alpine AS production

# Security: run as non-root
RUN addgroup -g 1001 nexora && adduser -u 1001 -G nexora -s /bin/sh -D nexora

WORKDIR /app

# Install production dependencies only
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force

# Copy built backend
COPY --from=backend-build /app/dist/ dist/

# Copy built frontend
COPY --from=frontend-build /app/dist/ public/

# Copy necessary config files
COPY .env* ./

# Create logs and backups directories
RUN mkdir -p logs backups && chown -R nexora:nexora /app

USER nexora

# Environment
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/v2/health/liveness || exit 1

CMD ["node", "dist/server.cjs"]
