# ---- Base image ----
FROM node:20-alpine AS base
RUN apk update && apk add --no-cache libc6-compat
WORKDIR /app

# Enable pnpm via corepack (comes with Node 20+)
RUN corepack enable && corepack prepare pnpm@latest --activate


# ---- Builder ----
FROM base AS builder

# Set up PNPM global bin directory to avoid "no global bin dir" error
ENV PNPM_HOME="/usr/local/share/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

# Install turbo globally
RUN pnpm add -g turbo@latest

# Copy full monorepo
COPY . .

# Generate a pruned monorepo for ws-server
RUN turbo prune ws-server --docker


# ---- Installer ----
FROM base AS installer
WORKDIR /app

# Copy only the pruned lockfile + package manifests
COPY --from=builder /app/out/json/ ./

# Install deps for pruned workspace
RUN pnpm install --frozen-lockfile

# Copy source code for the pruned workspace
COPY --from=builder /app/out/full/ .

# Build ws-server
RUN pnpm turbo run build --filter=ws-server...


# ---- Runner ----
FROM base AS runner
WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 wsuser
USER wsuser

# Copy only built files + runtime deps
COPY --from=installer --chown=wsuser:nodejs /app/apps/ws-server ./apps/ws-server
COPY --from=installer --chown=wsuser:nodejs /app/node_modules ./node_modules
COPY --from=installer --chown=wsuser:nodejs /app/package.json ./package.json

EXPOSE 4000

# Start the ws-server workspace
CMD ["pnpm", "--filter", "ws-server", "run", "start"]
