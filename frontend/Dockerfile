FROM node:18-alpine

WORKDIR /app

# Install dependencies (git for npm, curl for health checks)
RUN apk add --no-cache curl git

# Copy root package.json for workspace setup
COPY package*.json ./

# Copy shared package
COPY shared/ ./shared/

# Copy frontend package files
COPY frontend/package*.json ./frontend/
COPY frontend/tsconfig.json ./frontend/
COPY frontend/tsconfig.node.json ./frontend/
COPY frontend/vite.config.ts ./frontend/
COPY frontend/tailwind.config.js ./frontend/
COPY frontend/postcss.config.js ./frontend/

# Install root dependencies first (for workspace setup)
RUN npm install

# Build shared package first
WORKDIR /app/shared
RUN npm run build

# Install frontend dependencies
WORKDIR /app/frontend
RUN npm ci --only=production

# Copy frontend source code
COPY frontend/ ./

# Build frontend
RUN npm run build

# Create non-root user
RUN addgroup -g 1001 -S marketplace && \
    adduser -S marketplace -u 1001

# Change ownership
RUN chown -R marketplace:marketplace /app

USER marketplace

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:${PORT:-3000}/ || exit 1

EXPOSE 3000

CMD ["npm", "start"] 