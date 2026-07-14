# Debian slim (glibc) so bcrypt/pg native prebuilt binaries install without a toolchain
FROM node:22-slim
WORKDIR /app

# Install production dependencies only
COPY package*.json ./
RUN npm install --omit=dev --no-audit --no-fund

# App source
COPY . .

# Render injects PORT; server.js falls back to 5000 locally
EXPOSE 5000
CMD ["node", "server.js"]
