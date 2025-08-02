FROM node:18-alpine

WORKDIR /app

# Install dependencies for native modules, git, curl and other tools
RUN apk add --no-cache python3 make g++ sqlite curl git

# Copy root package.json for workspace setup
COPY package*.json ./

# Copy shared package
COPY shared/ ./shared/

# Copy backend package files  
COPY backend/package*.json ./backend/
COPY backend/tsconfig.json ./backend/

# Install root dependencies first (for workspace setup)
RUN npm install

# Build shared package first
WORKDIR /app/shared
RUN npm run build

# Switch to backend directory and install dependencies
WORKDIR /app/backend
RUN npm ci

# Copy backend source code
COPY backend/ ./

# Generate Prisma client
RUN npm run db:generate

# Build backend
RUN npm run build

# Create data directory for SQLite
RUN mkdir -p /app/data && \
    chown marketplace:marketplace /app/data

# Create non-root user
RUN addgroup -g 1001 -S marketplace && \
    adduser -S marketplace -u 1001

# Change ownership of all necessary directories to the new user
RUN chown -R marketplace:marketplace /app /app/backend /app/shared /app/data

USER marketplace

# Health check with longer start period (60s instead of default 30s)
HEALTHCHECK --interval=30s --timeout=3s --start-period=60s --retries=5 \
  CMD curl -f http://localhost:${PORT:-3001}/health || exit 1

# Copy startup script
COPY backend/start.sh /app/start.sh
RUN chmod +x /app/start.sh

EXPOSE 3001

CMD ["/app/start.sh"]