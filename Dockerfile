# ==========================================
# Stage 1: Build Frontend Assets
# ==========================================
FROM node:22-alpine AS client-builder
WORKDIR /app/client

COPY client/package*.json ./
RUN npm ci

COPY client/ ./
RUN npm run build

# ==========================================
# Stage 2: Production Runner
# ==========================================
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

# Install build dependencies for better-sqlite3 native bindings on Alpine if needed
RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm ci --omit=dev

# Copy server code
COPY server/ ./server/

# Copy built frontend assets from stage 1
COPY --from=client-builder /app/dist/client ./dist/client

# Create persistent data directory for SQLite
RUN mkdir -p /app/data && chown -R node:node /app

USER node

EXPOSE 5000

VOLUME ["/app/data"]

CMD ["node", "server/index.js"]
