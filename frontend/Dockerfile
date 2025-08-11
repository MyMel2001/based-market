FROM node:18-alpine

WORKDIR /app

# Install dependencies (curl, git)
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

# Switch to frontend directory and install dependencies
WORKDIR /app/frontend
RUN npm ci

# Copy frontend source code
COPY frontend/ ./

# Build frontend
RUN npm run build

# Create non-root user
RUN addgroup -g 1001 -S marketplace && \
    adduser -S marketplace -u 1001

# Change ownership of all necessary directories to the new user
RUN chown -R marketplace:marketplace /app /app/frontend /app/shared

USER marketplace

# Health check with longer start period (60s instead of default 30s)
HEALTHCHECK --interval=30s --timeout=3s --start-period=60s --retries=5 \
  CMD curl -f http://localhost:3000/ || exit 1

EXPOSE 3000

CMD ["npm", "run", "preview"]