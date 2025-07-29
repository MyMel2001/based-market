# SQLite Database Setup for Based Marketplace

## 🗄️ Why SQLite?

The Based Marketplace now uses **SQLite** as the default database, providing several advantages over PostgreSQL:

### ✅ Benefits of SQLite

1. **Zero Configuration**: No database server to install or configure
2. **Portable**: Single file database that's easy to backup and move
3. **Faster Development**: Instant setup, no connection strings
4. **Production Ready**: Handles millions of rows efficiently
5. **ACID Compliant**: Full transaction support like PostgreSQL
6. **Embedded**: Runs in the same process as your application
7. **Cross-Platform**: Works on any operating system

### 🚀 Performance Enhancements

The marketplace includes **QuickDB** for additional performance:

- **Caching Layer**: Frequently accessed data cached in memory
- **Metrics Storage**: Real-time analytics and counters
- **Session Management**: Fast user session handling
- **Rate Limiting**: Efficient request throttling
- **Federation Cache**: ActivityPub object caching

## 📁 File Structure

```
backend/
├── marketplace.db          # Main SQLite database (Prisma)
├── quickdb.sqlite          # QuickDB for caching/metrics
├── prisma/
│   ├── schema.prisma       # Database schema
│   └── migrations/         # Schema migrations
└── src/
    ├── config/database.ts  # Database connection
    └── services/
        ├── storage.ts      # Storage abstraction
        └── quickdb.ts      # QuickDB service
```

## 🔧 Environment Configuration

### Default Configuration
```env
# SQLite Database (file-based)
DATABASE_URL="file:./marketplace.db"

# Storage mode
STORAGE_MODE="database"  # or "activitypub"
```

### Advanced Configuration
```env
# Custom database location
DATABASE_URL="file:./data/marketplace.db"

# Database options
DB_CACHE_SIZE=2000
DB_TIMEOUT=30000
```

## 🛠️ Setup Instructions

### 1. Initialize Database

```bash
# Navigate to backend
cd backend

# Generate Prisma client
npm run db:generate

# Run migrations (creates tables)
npm run db:push

# Optional: Seed with sample data
npm run db:seed
```

### 2. Start Development

```bash
# Start the server
npm run dev
```

The SQLite database file will be created automatically on first run.

### 3. Verify Setup

```bash
# Check if database file exists
ls -la marketplace.db

# View database schema (optional)
sqlite3 marketplace.db ".schema"
```

## 📊 Database Operations

### Prisma Operations
```typescript
// Standard Prisma usage - works the same as PostgreSQL
const user = await prisma.user.create({
  data: { email, username, password }
});

const products = await prisma.product.findMany({
  include: { developer: true }
});
```

### QuickDB Operations
```typescript
// Fast caching and metrics
import { quickDBService, metrics } from './services/quickdb';

// Cache frequently accessed data
await quickDBService.setCache('user:123', userData, 300); // 5 min TTL

// Track metrics
await metrics.incrementProductView('product-123');
await metrics.incrementUserLogin();

// Session management
await quickDBService.setSession(sessionId, sessionData);
```

## 🔄 Database Management

### Backup
```bash
# Simple file copy
cp marketplace.db marketplace-backup-$(date +%Y%m%d).db

# With compression
tar -czf marketplace-backup-$(date +%Y%m%d).tar.gz marketplace.db quickdb.sqlite
```

### Restore
```bash
# Stop the application first
# Replace database file
cp marketplace-backup-20240101.db marketplace.db

# Restart application
npm run dev
```

### Migration
```bash
# Create new migration
npx prisma migrate dev --name add_new_feature

# Apply migrations to production
npx prisma migrate deploy
```

## 📈 Performance Optimizations

### SQLite Configuration
```typescript
// In database.ts - optimizations are built in
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'file:./marketplace.db'
    }
  }
});
```

### Caching Strategy
```typescript
// Automatic caching in storage service
async getUserById(id: string): Promise<User | null> {
  // 1. Check QuickDB cache first
  const cached = await quickDBService.getCache(`user:${id}`);
  if (cached) return cached;
  
  // 2. Query SQLite database
  const user = await prisma.user.findUnique({ where: { id } });
  
  // 3. Cache result for future requests
  if (user) {
    await quickDBService.setCache(`user:${id}`, user, 300);
  }
  
  return user;
}
```

## 🚀 Production Deployment

### Option 1: Single File Deployment
```bash
# Build application
npm run build

# Copy database file with application
rsync -av marketplace.db dist/ user@server:/app/
```

### Option 2: Docker Deployment
```dockerfile
# Dockerfile already configured for SQLite
FROM node:18-alpine

WORKDIR /app
COPY . .

# Database will be created in container
VOLUME ["/app/data"]
ENV DATABASE_URL="file:./data/marketplace.db"

RUN npm install && npm run build
CMD ["npm", "start"]
```

### Option 3: Volume Mount
```yaml
# docker-compose.yml
version: '3.8'
services:
  marketplace:
    build: .
    volumes:
      - ./data:/app/data
    environment:
      - DATABASE_URL=file:./data/marketplace.db
```

## 🔍 Monitoring & Debugging

### Database Inspection
```bash
# SQLite CLI
sqlite3 marketplace.db

# View tables
.tables

# Describe table structure
.schema users

# Query data
SELECT COUNT(*) FROM users;
SELECT * FROM products LIMIT 5;
```

### Performance Monitoring
```typescript
// Built-in metrics
import { metrics } from './services/quickdb';

// View metrics
const userCount = await metrics.getMetric('users:registrations');
const productViews = await metrics.getMetric('product:123:views');
```

### Debug Queries
```typescript
// Enable query logging
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error']
});
```

## 🔄 Migration from PostgreSQL

If you're migrating from PostgreSQL:

### 1. Export Data
```bash
# From PostgreSQL
pg_dump -d marketplace --data-only --inserts > data.sql
```

### 2. Convert to SQLite
```bash
# Install converter
npm install -g pg-to-sqlite

# Convert schema and data
pg-to-sqlite postgresql://user:pass@localhost/marketplace marketplace.db
```

### 3. Update Configuration
```env
# Change from PostgreSQL
# DATABASE_URL="postgresql://user:pass@localhost:5432/marketplace"

# To SQLite
DATABASE_URL="file:./marketplace.db"
```

## 🔧 Troubleshooting

### Database Locked Error
```bash
# Check for long-running transactions
lsof marketplace.db

# Restart application if needed
npm run dev
```

### Corruption Recovery
```bash
# Check integrity
sqlite3 marketplace.db "PRAGMA integrity_check;"

# Recover from backup
cp marketplace-backup.db marketplace.db
```

### Permission Issues
```bash
# Fix file permissions
chmod 664 marketplace.db
chown $USER:$USER marketplace.db
```

## 📊 Storage Comparison

| Feature | SQLite | PostgreSQL | MongoDB (ActivityPub) |
|---------|--------|------------|----------------------|
| Setup Complexity | ✅ None | ❌ Complex | ⚠️ Medium |
| Performance | ✅ Fast | ✅ Fast | ⚠️ Network dependent |
| Scalability | ⚠️ Single writer | ✅ High | ✅ Federated |
| Backup | ✅ File copy | ⚠️ pg_dump | ⚠️ Complex |
| Development | ✅ Instant | ❌ Setup required | ❌ Setup required |
| Production | ✅ Simple | ✅ Enterprise | ✅ Decentralized |

## 🎯 Best Practices

1. **Regular Backups**: Automate daily database file copies
2. **Vacuum Regularly**: Use `PRAGMA auto_vacuum = INCREMENTAL`
3. **Monitor Size**: Watch database file growth
4. **Use Transactions**: Wrap related operations in transactions
5. **Index Wisely**: Add indexes for frequently queried columns
6. **Cache Smartly**: Use QuickDB for hot data
7. **Test Migrations**: Always test schema changes in development

## 🌟 Why This Combination?

**SQLite + QuickDB + Prisma** provides:

- **Simplicity**: No database server setup
- **Performance**: File-based with intelligent caching
- **Reliability**: ACID transactions with backup simplicity
- **Development Speed**: Instant setup and testing
- **Production Ready**: Handles high load efficiently
- **Federation Ready**: Seamlessly works with ActivityPub mode

This setup gives you the best of both worlds: the simplicity of file-based storage with the performance of enterprise databases!

---

**Ready to build with SQLite?** Your marketplace database is just a file away! 🚀 