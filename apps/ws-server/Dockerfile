# ---- Base image ----
FROM node:20-alpine3.19 AS base
RUN apk update && apk add --no-cache libc6-compat
WORKDIR /app


# ---- Prune Stage ----
FROM base AS prune
WORKDIR /app

# Install turbo globally
RUN npm install -g turbo

# Copy the full monorepo and prune for ws-server
COPY . .

# Prune the repo to only include ws-server and its deps
RUN turbo prune ws-server --docker


# ---- Installer (dev + prod deps) ----
FROM base AS installer
WORKDIR /app

# Copy pruned package manifests
COPY --from=prune /app/out/json/ ./
# ✅ Copy package-lock.json for npm to work and for Turbo to detect npm
COPY --from=prune /app/package-lock.json ./package-lock.json

# Install all dependencies (used for building)
RUN npm install


# ---- Installer (production deps only) ----
FROM base AS installer-production
WORKDIR /app

COPY --from=prune /app/out/json/ ./
# ✅ Also copy lockfile here
COPY --from=prune /app/package-lock.json ./package-lock.json

RUN npm install --omit=dev


# ---- Builder ----
FROM base AS builder
WORKDIR /app

COPY --from=installer /app/node_modules ./node_modules
COPY --from=prune /app/out/full/ .

# ✅ Build ws-server (Turbo will now find npm)
RUN npx turbo run build --filter=ws-server...


# ---- Runner ----
FROM base AS runner
WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 ws-group \
  && adduser --system --uid 1001 ws-user
USER ws-user

# Copy production node_modules and built output
COPY --from=installer-production --chown=ws-user:ws-group /app/node_modules ./node_modules
COPY --from=builder --chown=ws-user:ws-group /app/apps/ws-server/dist ./apps/ws-server/dist
COPY --from=builder --chown=ws-user:ws-group /app/apps/ws-server/package.json ./apps/ws-server/package.json

WORKDIR /app/apps/ws-server
EXPOSE 4000

# Start the compiled server
CMD ["npm", "run", "start"]
