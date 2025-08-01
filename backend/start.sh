#!/bin/sh

# Wait for database to be ready (if using external database)
echo "🔍 Checking database connection..."

# Run database migrations
echo "🔄 Running database migrations..."
npm run db:push

# Generate Prisma client (in case it's missing)
echo "🔧 Generating Prisma client..."
npm run db:generate

# Start the application
echo "🚀 Starting application..."
exec npm start 