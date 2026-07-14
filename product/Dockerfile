# ---------- Build stage: compile the Angular app ----------
FROM node:22-alpine AS build
WORKDIR /app

# Install deps first (better layer caching)
COPY package*.json ./
RUN npm install --no-audit --no-fund

# Build the bundle -> /app/dist/product
COPY . .
RUN npm run build

# ---------- Runtime stage: serve via the existing Express server ----------
FROM node:22-alpine
WORKDIR /app

# server.js only needs express + cors at runtime (not the whole Angular toolchain)
RUN npm install express cors --no-audit --no-fund

COPY --from=build /app/dist ./dist
COPY --from=build /app/server.js ./server.js

# Render injects PORT; server.js falls back to 10000 locally
EXPOSE 10000
CMD ["node", "server.js"]
