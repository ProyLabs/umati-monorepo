# ---- Base image ----
FROM node:20-alpine AS base
WORKDIR /app

# ---- Dependencies ----
COPY package*.json ./
RUN npm install --production

# ---- App code ----
COPY . .

# ---- Build ----
RUN npm run build || echo "no build step"

# ---- Run ----
EXPOSE 4000
CMD ["npm", "run", "start"]