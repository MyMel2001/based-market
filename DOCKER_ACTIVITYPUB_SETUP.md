# Docker Setup for ActivityPub Federation Mode

## 🌐 Overview

This Docker setup configures the marketplace in **ActivityPub federation mode** with:

- **SQLite + QuickDB** - Unified database for ActivityPub objects and caching
- **Persistent Monero Wallet** - Automatically created and managed
- **ActivityPub Federation** - Connect to the fediverse
- **Single Database File** - No MongoDB required, everything in SQLite

## 🚀 Quick Start

### 1. Start Services

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f
```

### 2. Initialize ActivityPub Federation

```bash
# Set up ActivityPub actors and federation
docker-compose exec backend npm run activitypub:setup
```

### 3. Access Services

- **Marketplace**: http://localhost:3000
- **API**: http://localhost:3001
- **SQLite Admin**: http://localhost:8081 (database browser)
- **Monero Daemon RPC**: http://localhost:18081
- **Monero Wallet RPC**: http://localhost:18083

## 🔧 Service Configuration

### SQLite (ActivityPub Storage)
```yaml
# Container: based-market-sqlite-admin
# Port: 8081
# Admin UI: http://localhost:8081
# Database: Single SQLite file with ActivityPub tables
```

### Monero Services (Required for Payments)
```yaml
# Monero Daemon
# Container: based-market-monerod
# Ports: 18080 (P2P), 18081 (RPC)
# Mode: Testnet (change for production)

# Monero Wallet RPC
# Container: based-market-wallet-rpc  
# Port: 18083
# Wallet: Auto-created and persistent
# Password: marketplace123 (configurable)
```

### Backend API (ActivityPub + SQLite)
```yaml
# Container: based-market-backend
# Port: 3001
# Storage: ActivityPub federation + SQLite fallback
# Data: Persisted in Docker volume
```

## 📁 Persistent Data

All data is automatically persisted in Docker volumes:

```bash
# View volumes
docker volume ls | grep based-market

# Volume locations:
# - monerod_data: Monero blockchain data
# - wallet_data: Monero wallet files
# - backend_data: SQLite database + QuickDB cache + ActivityPub objects
```

## 🔐 Monero Wallet Management

### Automatic Wallet Creation

The Docker setup automatically:

1. **Creates a new Monero wallet** on first run
2. **Generates a seed phrase** and stores it securely
3. **Persists wallet data** in Docker volumes
4. **Connects to the testnet** for development

### Wallet Access

```bash
# View wallet status
docker-compose exec monero-wallet-rpc monero-wallet-cli --testnet --wallet-file /home/monero/wallet/marketplace-wallet --password marketplace123

# Get wallet address
curl http://localhost:18083/json_rpc -d '{"jsonrpc":"2.0","id":"0","method":"get_address"}' -H 'Content-Type: application/json'

# Check balance
curl http://localhost:18083/json_rpc -d '{"jsonrpc":"2.0","id":"0","method":"get_balance"}' -H 'Content-Type: application/json'
```

### Wallet Backup

```bash
# Export wallet files (IMPORTANT for production)
docker cp based-market-wallet-rpc:/home/monero/wallet ./wallet-backup-$(date +%Y%m%d)

# View wallet seed (for backup)
docker-compose exec monero-wallet-rpc monero-wallet-cli --testnet --wallet-file /home/monero/wallet/marketplace-wallet --password marketplace123 --command "seed"
```

## 🌐 ActivityPub Federation

### Federation Setup

```bash
# Initialize federation (run once)
docker-compose exec backend npm run activitypub:setup

# Check federation status
curl http://localhost:3001/.well-known/nodeinfo
```

### WebFinger Discovery

Your marketplace will be discoverable as:
```
@marketplace@localhost:3001
```

From Mastodon or other fediverse platforms, search for this handle to follow your marketplace.

### Federation Features

- ✅ **Product federation**: New products appear in followers' timelines
- ✅ **User discovery**: Users discoverable via WebFinger
- ✅ **Transaction transparency**: Purchase activities are public
- ✅ **Cross-platform interaction**: Users can follow from Mastodon

## 🔧 Environment Configuration

### Development (Default)
```env
# Uses testnet Monero and local domain
ACTIVITYPUB_DOMAIN=localhost:3001
ACTIVITYPUB_BASE_URL=http://localhost:3001
MONERO_WALLET_PASSWORD=marketplace123
```

### Production Setup

1. **Update domain configuration**:
```env
ACTIVITYPUB_DOMAIN=yourmarketplace.com
ACTIVITYPUB_BASE_URL=https://yourmarketplace.com
```

2. **Secure passwords**:
```env
MONGO_ROOT_PASSWORD=secure-random-password
MONERO_WALLET_PASSWORD=secure-wallet-password
JWT_SECRET=secure-jwt-secret
```

3. **Enable mainnet Monero**:
```yaml
# In docker-compose.yml, remove --testnet flags
monerod:
  command: >
    monerod --rpc-bind-ip=0.0.0.0 --rpc-bind-port=18081
    # Remove: --testnet
```

## 📊 Monitoring & Administration

### Database Administration
```bash
# SQLite Web Admin UI
# http://localhost:8081
# Browse SQLite tables including ActivityPub objects

# Direct SQLite access
docker-compose exec backend sqlite3 /app/data/marketplace.db
```

### Service Health Checks
```bash
# Check all services
docker-compose ps

# View service logs
docker-compose logs backend
docker-compose logs monerod  
docker-compose logs monero-wallet-rpc
docker-compose logs sqlite-web

# Check Monero sync status
curl http://localhost:18081/json_rpc -d '{"jsonrpc":"2.0","id":"0","method":"get_info"}' -H 'Content-Type: application/json'
```

### Performance Monitoring
```bash
# Container resource usage
docker stats

# Volume space usage
docker system df
```

## 🔄 Data Management

### Backup Strategy
```bash
# Full backup script
#!/bin/bash
DATE=$(date +%Y%m%d)
mkdir -p ./backups/$DATE

# Backup SQLite database (includes ActivityPub objects)
docker cp based-market-backend:/app/data/marketplace.db ./backups/$DATE/
docker cp based-market-backend:/app/data/quickdb.sqlite ./backups/$DATE/

# Backup Monero wallet
docker cp based-market-wallet-rpc:/home/monero/wallet ./backups/$DATE/wallet

# Backup backend data (SQLite + QuickDB)
docker cp based-market-backend:/app/data ./backups/$DATE/backend-data

echo "Backup completed: ./backups/$DATE"
```

### Restore from Backup
```bash
# Stop services
docker-compose down

# Restore SQLite database
docker-compose up -d backend
docker cp ./backups/20240101/marketplace.db based-market-backend:/app/data/
docker cp ./backups/20240101/quickdb.sqlite based-market-backend:/app/data/

# Restore Monero wallet
docker cp ./backups/20240101/wallet based-market-wallet-rpc:/home/monero/

# Restore backend data  
docker cp ./backups/20240101/backend-data based-market-backend:/app/

# Restart all services
docker-compose up -d
```

## 🚨 Troubleshooting

### Monero Services
```bash
# Monero daemon not syncing
docker-compose logs monerod

# Wallet connection issues
docker-compose logs monero-wallet-rpc

# Reset Monero data (will resync blockchain)
docker-compose down
docker volume rm based-market_monerod_data
docker-compose up -d
```

### SQLite Issues
```bash
# SQLite database problems
docker-compose logs backend

# Check database integrity
docker-compose exec backend sqlite3 /app/data/marketplace.db "PRAGMA integrity_check;"

# Reset SQLite data (DANGER: loses all data)
docker-compose down
docker volume rm based-market_backend_data
docker-compose up -d backend
```

### ActivityPub Federation
```bash
# Test federation endpoints
curl http://localhost:3001/.well-known/webfinger?resource=acct:marketplace@localhost:3001
curl http://localhost:3001/.well-known/nodeinfo

# Check ActivityPub setup
docker-compose exec backend npm run activitypub:setup
```

## 🌟 Production Deployment

### SSL/TLS Setup
```yaml
# Add reverse proxy (nginx/traefik)
# Update ACTIVITYPUB_BASE_URL to https://
# Ensure proper SSL certificates
```

### Security Hardening
```yaml
# Update default passwords
# Restrict network access
# Enable firewall rules
# Regular security updates
```

### Scaling Considerations
```yaml
# MongoDB replica sets
# Load balancer for backend
# CDN for static assets
# Monero node clustering
```

---

**Your federated marketplace is ready!** 🚀

Connect with the fediverse, accept Monero payments, and build the decentralized future of commerce. 