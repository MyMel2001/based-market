FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install system dependencies for SQLite and better-sqlite3
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    sqlite

# Copy package files
COPY package*.json ./
COPY ../shared/package.json ../shared/

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Copy shared types
COPY ../shared ../shared

# Create data directory for SQLite and QuickDB files
RUN mkdir -p /app/data

# Generate Prisma client
RUN npx prisma generate

# Build the application
RUN npm run build

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S marketplace -u 1001 -G nodejs

# Change ownership of app directory
RUN chown -R marketplace:nodejs /app

# Switch to non-root user
USER marketplace

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3001/api/health || exit 1

# Start command
CMD ["npm", "start"] 