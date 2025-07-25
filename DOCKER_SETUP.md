# Docker Setup with Integrated Monero

## Quick Start

```bash
# Clone and start everything
git clone <repository-url>
cd based-games
docker-compose up -d

# Initialize database
docker-compose exec backend npm run db:migrate

# Access services
# Frontend: http://localhost:3000
# Backend: http://localhost:3001  
# Database Admin: http://localhost:8080
# Monero Daemon: http://localhost:18081
# Monero Wallet RPC: http://localhost:18083
```

## What's Included

- **PostgreSQL Database**: Ready for marketplace data
- **Backend API**: Express.js with TypeScript
- **Frontend App**: React with TypeScript
- **Monero Daemon**: Testnet node for development
- **Monero Wallet RPC**: Pre-configured wallet
- **Database Admin**: Adminer web interface

## Monero Services

The Docker setup automatically includes:
- **Testnet Monero daemon** for safe development
- **Pre-configured wallet RPC** for payment processing
- **Development credentials** (wallet password: `dev-wallet-password`)

First startup may take 5-10 minutes for Monero sync.

## Verification

Test Monero services:
```bash
# Check daemon
curl http://localhost:18081/json_rpc -d '{"jsonrpc":"2.0","id":"0","method":"get_info"}' -H 'Content-Type: application/json'

# Check wallet
curl http://localhost:18083/json_rpc -d '{"jsonrpc":"2.0","id":"0","method":"get_address"}' -H 'Content-Type: application/json'
``` 