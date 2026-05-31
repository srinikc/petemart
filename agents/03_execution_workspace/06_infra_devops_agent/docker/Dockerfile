# =============================================================================
# PeteMart — Multi-stage Production Dockerfile
# =============================================================================
# Stages:
#   base         — Shared deps and config
#   development  — Hot-reload dev server (pnpm dev)
#   builder      — Production build
#   production   — Slim production image with standalone server
# =============================================================================

# ── Stage 0: Base ────────────────────────────────────────────────────────────
FROM node:20-alpine AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable && corepack prepare pnpm@9 --activate

WORKDIR /app

# Copy package manifests
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json ./apps/web/

# ── Stage 1: Development ────────────────────────────────────────────────────
FROM base AS development

# Install all deps (including devDependencies)
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

EXPOSE 3000

CMD ["pnpm", "dev"]

# ── Stage 2: Builder ─────────────────────────────────────────────────────────
FROM base AS builder

# Install production deps only
RUN pnpm install --frozen-lockfile --prod

# Copy source
COPY . .

# Build the Next.js app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}

RUN pnpm build

# ── Stage 3: Production ─────────────────────────────────────────────────────
FROM node:20-alpine AS production

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

WORKDIR /app

# Copy only the standalone Next.js output
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/apps/web/public ./apps/web/public

USER nextjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

CMD ["node", "apps/web/server.js"]
