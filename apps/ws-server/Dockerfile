# ---- Base image ----
FROM node:20-alpine3.19 AS base
RUN apk update && apk add --no-cache libc6-compat
WORKDIR /app

# ✅ Install pnpm directly (skip Corepack issues)
RUN npm install -g pnpm@9


# ---- Prune Stage ----
FROM base AS prune
WORKDIR /app

# Install Turbo globally
RUN pnpm add -g turbo@latest

# Copy the full monorepo
COPY . .

# Prune the monorepo for ws-server workspace
RUN turbo prune ws-server --docker


# ---- Installer (dev + prod deps) ----
FROM base AS installer
WORKDIR /app

# Copy pruned manifest files (includes pnpm-lock.yaml)
COPY --from=prune /app/out/json/ ./

# Install all deps (for build)
RUN pnpm install --frozen-lockfile


# ---- Installer (production deps only) ----
FROM base AS installer-production
WORKDIR /app

# Copy pruned manifest files (includes pnpm-lock.yaml)
COPY --from=prune /app/out/json/ ./

# Install only production dependencies
RUN pnpm install --prod --frozen-lockfile


# ---- Builder ----
FROM base AS builder
WORKDIR /app

# Copy deps and full code
COPY --from=installer /app/node_modules ./node_modules
COPY --from=prune /app/out/full/ .

# Build ws-server → dist/
RUN pnpm turbo run build --filter=ws-server...


# ---- Runner ----
FROM base AS runner
WORKDIR /app

# Create a non-root user
RUN addgroup --system --gid 1001 ws-group \
  && adduser --system --uid 1001 ws-user
USER ws-user

# Copy only what’s needed for production
COPY --from=installer-production --chown=ws-user:ws-group /app/node_modules ./node_modules
COPY --from=builder --chown=ws-user:ws-group /app/apps/ws-server/dist ./apps/ws-server/dist
COPY --from=builder --chown=ws-user:ws-group /app/apps/ws-server/package.json ./apps/ws-server/package.json

WORKDIR /app/apps/ws-server
EXPOSE 4000

# Start the built app
CMD ["pnpm", "run", "start"]
