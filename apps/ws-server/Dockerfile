# ---- Base image ----
FROM node:20-alpine AS base
WORKDIR /app

# ---- Install pnpm ----
RUN corepack enable && corepack prepare pnpm@latest --activate

# ---- Dependencies ----
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# ---- App code ----
COPY . .

# ---- Build ----
RUN pnpm run build || echo "no build step"

# ---- Run ----
EXPOSE 4000
CMD ["pnpm", "run", "start"]
