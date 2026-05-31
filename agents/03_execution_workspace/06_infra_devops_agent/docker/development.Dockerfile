# =============================================================================
# PeteMart — Development Dockerfile (lightweight, fast rebuilds)
# =============================================================================
# Optimized for local development with hot-reload and volume mounts.
# Use with docker-compose.yml for full stack local dev.
# =============================================================================

FROM node:20-alpine AS development

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9 --activate

WORKDIR /app

# Copy only dependency files for layer caching
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json ./apps/web/
COPY packages/ ./packages/

# Install ALL dependencies (including devDeps)
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile

# Copy the rest of the application source
COPY . .

# Expose Next.js port
EXPOSE 3000

# Health check for dev
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000 || exit 1

# Start development server with hot-reload
CMD ["pnpm", "dev"]
