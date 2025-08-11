# Use a lightweight Node.js base image
FROM node:18-alpine

# Set the working directory for the application inside the container
WORKDIR /app

# Install system-level dependencies required for building native modules (like SQLite),
# running git, curl (for healthcheck), and other necessary tools.
# This layer is highly cacheable; it only rebuilds if the apk add commands change.
RUN apk add --no-cache python3 make g++ sqlite curl git

# Copy only the package.json and package-lock.json files from the root
# These are needed for setting up the workspace and installing initial dependencies.
# This layer will be rebuilt if package.json or package-lock.json change at the root.
COPY package*.json ./

# Copy the package.json for the 'shared' workspace.
# This ensures that 'npm install' can properly resolve dependencies for 'shared'.
COPY shared/package*.json ./shared/

# Copy the package.json and tsconfig.json for the 'backend' workspace.
# These are needed for dependency installation and TypeScript configuration.
COPY backend/package*.json ./backend/
COPY backend/tsconfig.json ./backend/

# Install all Node.js dependencies across the entire workspace.
# 'npm install' at the root handles dependencies for both backend and shared workspaces.
# This layer benefits from Docker's cache if package.json/package-lock.json don't change.
RUN npm install

# Build the 'shared' workspace package first, as the 'backend' may depend on it.
# We explicitly change directory to shared, build, then return to /app.
WORKDIR /app/shared
RUN npm run build
WORKDIR /app # Return to the root /app directory

# Copy the remaining source code for both shared and backend workspaces.
# Placing this after dependency installation helps Docker cache the npm install layer.
# This layer will be rebuilt if any source file in shared/ or backend/ changes.
COPY shared/ ./shared/
COPY backend/ ./backend/

# Switch to the backend application directory.
WORKDIR /app/backend

# Generate the Prisma client.
# This command must run after all Node.js dependencies are installed and
# the Prisma schema files (part of backend/ source) are copied.
RUN npm run db:generate

# Build the backend application (e.g., TypeScript compilation to JavaScript).
# This creates the 'dist' directory used by the CMD.
RUN npm run build

# Create a dedicated data directory for SQLite database files.
# It's given a specific UID/GID (1001) for the non-root 'marketplace' user.
RUN mkdir -p /app/data && \
    chown -R 1001:1001 /app/data

# Create a non-root user and group named 'marketplace' with UID/GID 1001.
# Running as a non-root user is a security best practice.
RUN addgroup -g 1001 -S marketplace && \
    adduser -S marketplace -u 1001 -G marketplace

# Change ownership of the entire /app directory and its contents to the 'marketplace' user.
# This ensures the application can read/write its own files when running as 'marketplace'.
RUN chown -R marketplace:marketplace /app

# Switch the user context for all subsequent commands and runtime to 'marketplace'.
USER marketplace

# Define a health check for the backend service.
# It attempts to curl the /health endpoint on the exposed port.
# interval: How often to run the check.
# timeout: How long to wait for a response from the check.
# start-period: Initial grace period during which health check failures don't count towards retries.
#               Increased to 180s (3 minutes) to account for database migrations,
#               initialization, and waiting for dependent Monero services to be ready.
# retries: Number of consecutive failures before the container is marked 'unhealthy'.
HEALTHCHECK --interval=30s --timeout=3s --start-period=180s --retries=5 \
  CMD curl -f http://localhost:3001/health || exit 1

# Copy the custom startup script for the backend.
COPY backend/start.sh /app/start.sh

# Make the startup script executable.
RUN chmod +x /app/start.sh

# Expose the port where the backend application will listen.
EXPOSE 3001

# Define the default command to run when the container starts.
# It executes the custom startup script.
CMD ["/app/start.sh"]
