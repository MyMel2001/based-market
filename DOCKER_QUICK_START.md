# 🚀 Docker Quick Start Guide

## One-Command Deployment

Get your federated marketplace running in 2 minutes:

```bash
# 1. Start all services
docker-compose up -d

# 2. Initialize ActivityPub federation
docker-compose exec backend npm run activitypub:setup

# ✅ Done! Access at http://localhost:3000
```

## What Gets Deployed

### 🌐 Services Started
- **Frontend**: React marketplace UI (port 3000)
- **Backend**: Express API + ActivityPub (port 3001)
- **SQLite**: Unified database storage (embedded)
- **SQLite Admin**: Database UI (port 8081)
- **Monero Daemon**: Testnet blockchain (ports 18080, 18081)
- **Monero Wallet**: Auto-created persistent wallet (port 18083)

### 💾 Persistent Data
All data automatically persisted in Docker volumes:
- **SQLite Database**: All data including ActivityPub objects in single file
- **Monero Wallet**: Auto-generated with secure backup  
- **QuickDB Cache**: Fast caching layer for performance

### 🔐 Auto-Generated Security
- **Monero Wallet**: Created on first run with password `marketplace123`
- **SQLite Database**: Single file with all data (no credentials needed)
- **JWT Secret**: Development key (change for production)

## Quick Commands

```bash
# Start/stop services
docker-compose up -d
docker-compose down

# View logs
docker-compose logs -f backend
docker-compose logs -f monerod

# Check service status
docker-compose ps

# Initialize federation
docker-compose exec backend npm run activitypub:setup

# Check wallet balance
curl http://localhost:18083/json_rpc -d '{"jsonrpc":"2.0","id":"0","method":"get_balance"}' -H 'Content-Type: application/json'

# Test federation
curl http://localhost:3001/.well-known/nodeinfo
```

## First Run Checklist

After `docker-compose up -d`:

1. ✅ **Services running**: `docker-compose ps` shows all green
2. ✅ **Frontend accessible**: http://localhost:3000 loads
3. ✅ **API responsive**: http://localhost:3001/api/health returns success
4. ✅ **SQLite admin**: http://localhost:8081 (database browser)
5. ✅ **ActivityPub setup**: Run `docker-compose exec backend npm run activitypub:setup`
6. ✅ **Monero syncing**: Check logs with `docker-compose logs monerod`

## Configuration Files

### Environment (docker.env)
```env
# Default configuration - ready to use
STORAGE_MODE=activitypub
ACTIVITYPUB_DOMAIN=localhost:3001
MONERO_WALLET_PASSWORD=marketplace123
```

### For Production
```env
# Update these for your domain
ACTIVITYPUB_DOMAIN=yourmarketplace.com
ACTIVITYPUB_BASE_URL=https://yourmarketplace.com

# Secure passwords
MONGO_ROOT_PASSWORD=secure-random-password
MONERO_WALLET_PASSWORD=secure-wallet-password
JWT_SECRET=secure-jwt-secret
```

## Testing Federation

Your marketplace will be discoverable as `@marketplace@localhost:3001`:

1. **WebFinger test**:
```bash
curl "http://localhost:3001/.well-known/webfinger?resource=acct:marketplace@localhost:3001"
```

2. **From Mastodon**: Search for `@marketplace@localhost:3001`

3. **NodeInfo**: 
```bash
curl http://localhost:3001/.well-known/nodeinfo
```

## Monero Wallet Management

### Auto-Created Wallet
- **Location**: `/home/monero/wallet/marketplace-wallet` (inside container)
- **Password**: `marketplace123` (configurable via `MONERO_WALLET_PASSWORD`)
- **Network**: Testnet (worthless coins for development)

### Backup Your Wallet
```bash
# Export wallet files (IMPORTANT!)
docker cp based-market-wallet-rpc:/home/monero/wallet ./wallet-backup-$(date +%Y%m%d)

# View wallet seed phrase (for recovery)
docker-compose exec monero-wallet-rpc monero-wallet-cli --testnet --wallet-file /home/monero/wallet/marketplace-wallet --password marketplace123 --command "seed"
```

### Wallet Operations
```bash
# Get wallet address
curl http://localhost:18083/json_rpc -d '{"jsonrpc":"2.0","id":"0","method":"get_address"}' -H 'Content-Type: application/json'

# Check balance
curl http://localhost:18083/json_rpc -d '{"jsonrpc":"2.0","id":"0","method":"get_balance"}' -H 'Content-Type: application/json'

# Get testnet coins (for testing)
# Visit: https://testnet.xmr.ditatompel.com/ and enter your address
```

## Data Backup

Simple backup of all data:

```bash
#!/bin/bash
DATE=$(date +%Y%m%d)

# Create backup directory
mkdir -p ./backups/$DATE

# Backup MongoDB
docker-compose exec mongodb mongodump --out /tmp/backup
docker cp based-market-mongodb:/tmp/backup ./backups/$DATE/mongodb

# Backup Monero wallet
docker cp based-market-wallet-rpc:/home/monero/wallet ./backups/$DATE/wallet

# Backup backend data (SQLite + QuickDB)
docker cp based-market-backend:/app/data ./backups/$DATE/backend-data

echo "✅ Backup completed: ./backups/$DATE"
```

## Troubleshooting

### Services Won't Start
```bash
# Check Docker status
docker --version
docker-compose --version

# View detailed logs
docker-compose logs
```

### Monero Not Syncing
```bash
# Check sync status
curl http://localhost:18081/json_rpc -d '{"jsonrpc":"2.0","id":"0","method":"get_info"}' -H 'Content-Type: application/json'

# Restart Monero services
docker-compose restart monerod monero-wallet-rpc
```

### Federation Not Working
```bash
# Re-run ActivityPub setup
docker-compose exec backend npm run activitypub:setup

# Check backend logs
docker-compose logs backend
```

### Reset Everything
```bash
# Nuclear option - destroys all data
docker-compose down -v
docker-compose up -d
docker-compose exec backend npm run activitypub:setup
```

## Port Usage

| Service | Port | Purpose |
|---------|------|---------|
| Frontend | 3000 | React marketplace UI |
| Backend | 3001 | API + ActivityPub endpoints |
| SQLite | - | Database (embedded in backend) |
| SQLite Web | 8081 | Database admin UI |
| Monero Daemon | 18080 | P2P network |
| Monero Daemon RPC | 18081 | Daemon API |
| Monero Wallet RPC | 18083 | Wallet API |

## What's Different from PostgreSQL

✅ **Benefits over PostgreSQL**:
- No database server to manage
- Single file SQLite database  
- QuickDB for blazing fast cache
- ActivityPub federation built-in
- Persistent Monero wallet included
- Zero configuration needed

🚀 **Perfect for**:
- Privacy-focused marketplaces
- Decentralized app distribution
- Monero-accepting businesses
- Fediverse integration

---

**Ready to federate?** Your marketplace is now connected to the decentralized web! 🌐 