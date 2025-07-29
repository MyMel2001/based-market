# Based Marketplace Deployment Guide

## 🚀 Deployment Options

The Based Marketplace supports multiple deployment configurations:

1. **Local Development** - SQLite + QuickDB
2. **Docker ActivityPub** - Full federation with persistent Monero wallet
3. **Production Deployment** - Scalable federation setup

## 📦 Docker Deployment (Recommended)

### Quick Start

```bash
# Clone repository
git clone <repository-url>
cd based-market

# Start all services
docker-compose up -d

# Initialize ActivityPub federation
docker-compose exec backend npm run activitypub:setup

# Access services
# - Marketplace: http://localhost:3000
# - API: http://localhost:3001  
# - MongoDB Admin: http://localhost:8081
```

### Services Architecture

```
🌐 Frontend (React)
     ↓
🔧 Backend API (Express + ActivityPub)
     ↓ ↓ ↓
📊 MongoDB    💰 Monero     📁 SQLite/QuickDB
(Federation)  (Payments)   (Local Cache)
```

### Persistent Data

All data is automatically persisted:

- **MongoDB**: ActivityPub objects, federation data
- **Monero Wallet**: Auto-created, persistent wallet
- **SQLite/QuickDB**: Local caching and metrics
- **Blockchain Data**: Monero testnet/mainnet sync

## 🔧 Configuration

### Environment Variables

**Development (Default)**:
```env
# Storage & Federation
STORAGE_MODE=activitypub
ACTIVITYPUB_DOMAIN=localhost:3001
ACTIVITYPUB_BASE_URL=http://localhost:3001

# Monero (Testnet)
MONERO_WALLET_PASSWORD=marketplace123

# Database
MONGO_ROOT_PASSWORD=password
JWT_SECRET=dev-jwt-secret
```

**Production**:
```env
# Your domain
ACTIVITYPUB_DOMAIN=marketplace.example.com
ACTIVITYPUB_BASE_URL=https://marketplace.example.com

# Secure passwords
MONGO_ROOT_PASSWORD=secure-mongo-password
MONERO_WALLET_PASSWORD=secure-wallet-password
JWT_SECRET=secure-random-jwt-secret

# Production mode
NODE_ENV=production
```

### Monero Configuration

**Testnet (Development)**:
- Uses worthless test coins
- Faster sync, smaller blockchain
- Automatic wallet creation

**Mainnet (Production)**:
```yaml
# Remove --testnet flags in docker-compose.yml
monerod:
  command: >
    monerod --rpc-bind-ip=0.0.0.0 --rpc-bind-port=18081
    # Remove: --testnet
```

## 🌐 Production Deployment

### 1. Domain Setup

**DNS Configuration**:
```dns
A     marketplace.example.com     → Your-Server-IP
AAAA  marketplace.example.com     → Your-IPv6 (optional)
```

**SSL Certificate**:
```bash
# Using Certbot
certbot --nginx -d marketplace.example.com
```

### 2. Production Docker Compose

Create `docker-compose.prod.yml`:

```yaml
version: '3.8'
services:
  backend:
    image: your-registry/based-market-backend:latest
    environment:
      - NODE_ENV=production
      - ACTIVITYPUB_DOMAIN=marketplace.example.com
      - ACTIVITYPUB_BASE_URL=https://marketplace.example.com
    volumes:
      - ./data:/app/data
      - ./ssl:/app/ssl:ro

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/ssl/certs:ro
```

### 3. Nginx Configuration

**nginx.conf**:
```nginx
server {
    listen 443 ssl http2;
    server_name marketplace.example.com;
    
    ssl_certificate /etc/ssl/certs/fullchain.pem;
    ssl_certificate_key /etc/ssl/certs/privkey.pem;
    
    # Frontend
    location / {
        proxy_pass http://frontend:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    # API & ActivityPub
    location /api/ {
        proxy_pass http://backend:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    location /.well-known/ {
        proxy_pass http://backend:3001;
        proxy_set_header Host $host;
    }
    
    location /ap/ {
        proxy_pass http://backend:3001;
        proxy_set_header Host $host;
    }
}
```

### 4. Security Hardening

**Firewall Rules**:
```bash
# Allow only necessary ports
ufw allow 22    # SSH
ufw allow 80    # HTTP
ufw allow 443   # HTTPS
ufw enable

# Monero ports (if exposing publicly)
ufw allow 18080 # Monero P2P
```

**Docker Security**:
```yaml
# Run containers as non-root
user: "1001:1001"

# Limit resources
deploy:
  resources:
    limits:
      memory: 512M
      cpus: '0.5'
```

## 📊 Monitoring & Maintenance

### Health Checks

```bash
# Service status
docker-compose ps

# API health
curl https://marketplace.example.com/api/health

# ActivityPub federation
curl https://marketplace.example.com/.well-known/nodeinfo

# Monero daemon
curl http://localhost:18081/json_rpc -d '{"jsonrpc":"2.0","id":"0","method":"get_info"}'
```

### Backup Strategy

**Automated Backup Script** (`backup.sh`):
```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/$DATE"

mkdir -p "$BACKUP_DIR"

# MongoDB backup
docker-compose exec mongodb mongodump --out /tmp/backup
docker cp $(docker-compose ps -q mongodb):/tmp/backup "$BACKUP_DIR/mongodb"

# Monero wallet backup
docker cp $(docker-compose ps -q monero-wallet-rpc):/home/monero/wallet "$BACKUP_DIR/wallet"

# Backend data (SQLite + QuickDB)
docker cp $(docker-compose ps -q backend):/app/data "$BACKUP_DIR/backend-data"

# Compress backup
tar -czf "/backups/marketplace-backup-$DATE.tar.gz" "$BACKUP_DIR"
rm -rf "$BACKUP_DIR"

echo "Backup completed: marketplace-backup-$DATE.tar.gz"
```

**Cron Setup**:
```cron
# Daily backups at 2 AM
0 2 * * * /path/to/backup.sh

# Weekly cleanup (keep last 4 weeks)
0 3 * * 0 find /backups -name "*.tar.gz" -mtime +28 -delete
```

### Log Management

```bash
# View logs
docker-compose logs -f backend
docker-compose logs -f mongodb
docker-compose logs -f monerod

# Log rotation
docker-compose logs --tail=1000 backend > backend.log
```

## 🔄 Updates & Maintenance

### Application Updates

```bash
# Pull latest images
docker-compose pull

# Restart services
docker-compose up -d

# Verify health
docker-compose ps
curl https://marketplace.example.com/api/health
```

### Database Migrations

```bash
# Backup before migration
./backup.sh

# Run migrations
docker-compose exec backend npm run db:migrate
```

### Monero Updates

```bash
# Update Monero containers
docker-compose pull monerod monero-wallet-rpc
docker-compose up -d monerod monero-wallet-rpc

# Verify sync status
curl http://localhost:18081/json_rpc -d '{"jsonrpc":"2.0","id":"0","method":"get_info"}'
```

## 🚨 Troubleshooting

### Common Issues

**Federation Not Working**:
```bash
# Check ActivityPub setup
docker-compose exec backend npm run activitypub:setup

# Verify DNS resolution
dig marketplace.example.com

# Test endpoints
curl https://marketplace.example.com/.well-known/webfinger?resource=acct:marketplace@marketplace.example.com
```

**Monero Issues**:
```bash
# Check daemon sync
curl http://localhost:18081/json_rpc -d '{"jsonrpc":"2.0","id":"0","method":"get_info"}'

# Restart Monero services
docker-compose restart monerod monero-wallet-rpc

# Check wallet
curl http://localhost:18083/json_rpc -d '{"jsonrpc":"2.0","id":"0","method":"get_address"}'
```

**Database Problems**:
```bash
# MongoDB issues
docker-compose logs mongodb
docker-compose exec mongodb mongosh --eval "db.adminCommand('ping')"

# Reset MongoDB (DANGER: loses data)
docker-compose down
docker volume rm based-market_mongodb_data
docker-compose up -d
```

### Recovery Procedures

**Restore from Backup**:
```bash
# Stop services
docker-compose down

# Extract backup
tar -xzf marketplace-backup-YYYYMMDD_HHMMSS.tar.gz

# Restore data
docker-compose up -d mongodb
docker cp backup/mongodb $(docker-compose ps -q mongodb):/tmp/restore
docker-compose exec mongodb mongorestore /tmp/restore

# Restart all services
docker-compose up -d
```

## 📈 Scaling Considerations

### Horizontal Scaling

**Load Balancer Setup**:
```yaml
# nginx.conf - upstream configuration
upstream backend {
    server backend1:3001;
    server backend2:3001;
    server backend3:3001;
}
```

**MongoDB Replica Set**:
```yaml
mongodb-primary:
  image: mongo:7
  command: mongod --replSet rs0 --bind_ip_all

mongodb-secondary:
  image: mongo:7  
  command: mongod --replSet rs0 --bind_ip_all
```

### Performance Optimization

**Resource Limits**:
```yaml
deploy:
  resources:
    limits:
      memory: 2G
      cpus: '1.0'
    reservations:
      memory: 1G
      cpus: '0.5'
```

**Caching Strategy**:
- QuickDB for hot data
- Redis for session storage (optional)
- CDN for static assets

## 🌟 Federation Features

### Cross-Platform Integration

Once deployed, your marketplace:

- ✅ **Appears in Mastodon searches**
- ✅ **Products federated to followers**
- ✅ **WebFinger discoverable**
- ✅ **ActivityStreams compliant**
- ✅ **Monero payment processing**

### Testing Federation

```bash
# From any Mastodon instance, search:
@marketplace@marketplace.example.com

# Test WebFinger
curl "https://marketplace.example.com/.well-known/webfinger?resource=acct:marketplace@marketplace.example.com"

# Test NodeInfo
curl "https://marketplace.example.com/.well-known/nodeinfo"
```

---

**Your federated marketplace is production-ready!** 🚀

Deploy with confidence using ActivityPub federation, persistent Monero payments, and enterprise-grade infrastructure. 