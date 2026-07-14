# ---------- Build stage: compile the Angular app ----------
FROM node:22-alpine AS build
WORKDIR /app

# Install deps first (better layer caching)
COPY package*.json ./
RUN npm install --no-audit --no-fund

# Build the bundle -> /app/dist/order
COPY . .
RUN npm run build

# ---------- Runtime stage: serve the static files ----------
FROM node:22-alpine
WORKDIR /app

# Only the built output + the tiny zero-dependency server are needed at runtime
COPY --from=build /app/dist ./dist
COPY --from=build /app/server.js ./server.js

# Render injects PORT; server.js falls back to 10000 locally
EXPOSE 10000
CMD ["node", "server.js"]
