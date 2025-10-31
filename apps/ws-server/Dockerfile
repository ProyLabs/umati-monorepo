# ---- Base image ----
FROM node:20-alpine3.19 AS base
RUN apk update && apk add --no-cache libc6-compat
WORKDIR /app

# Enable pnpm via corepack (comes with Node 20+)
RUN corepack enable && corepack prepare pnpm@latest --activate

# Ensure global binaries can install correctly
ENV PNPM_HOME="/usr/local/share/pnpm"
ENV PATH="$PNPM_HOME:$PATH"


# ---- Prune Stage ----
FROM base AS prune
WORKDIR /app

# Install turbo globally
RUN pnpm add -g turbo@latest

# Copy full monorepo and prune for ws-server
COPY . .
RUN turbo prune ws-server --docker


# ---- Installer (dev + prod deps) ----
FROM base AS installer
WORKDIR /app

# Copy pruned lockfile and package manifests
COPY --from=prune /app/out/json/ ./

# Install all deps (dev + prod) for build
RUN pnpm install --frozen-lockfile


# ---- Installer (production deps only) ----
FROM base AS installer-production
WORKDIR /app

# Copy pruned lockfile and package manifests
COPY --from=prune /app/out/json/ ./

# Install only production deps
RUN pnpm install --prod --frozen-lockfile


# ---- Builder ----
FROM base AS builder
WORKDIR /app

# Copy installed deps (dev+prod)
COPY --from=installer /app/node_modules ./node_modules

# Copy source code for pruned workspace
COPY --from=prune /app/out/full/ .

# Build ws-server (outputs to apps/ws-server/dist)
RUN pnpm turbo run build --filter=ws-server...


# ---- Runner ----
FROM base AS runner
WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 ws-group \
  && adduser --system --uid 1001 ws-user
USER ws-user

# Copy production node_modules and built files
COPY --from=installer-production --chown=ws-user:ws-group /app/node_modules ./node_modules
COPY --from=builder --chown=ws-user:ws-group /app/apps/ws-server/dist ./apps/ws-server/dist
COPY --from=builder --chown=ws-user:ws-group /app/apps/ws-server/package.json ./apps/ws-server/package.json

WORKDIR /app/apps/ws-server
EXPOSE 4000

# Start the built app
CMD ["pnpm", "start"]
