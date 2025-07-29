# Monero Requirements for Based Marketplace

## 🪙 Critical: Monero Daemon Required

**The Monero daemon (monerod) is NOT optional** - it is **required for payment processing** in both storage modes.

### Why Monero is Required

This marketplace uses **Monero cryptocurrency** for all paid transactions:
- **Privacy-focused payments**: Monero provides private, untraceable transactions
- **Decentralized currency**: No central authority controls the payment system
- **Low fees**: Minimal transaction costs compared to traditional payment processors
- **Global accessibility**: Works worldwide without banking restrictions

### Monero Services Needed

Both storage modes require these Monero services:

1. **Monero Daemon (monerod)**
   - Connects to the Monero network
   - Validates transactions
   - Required for payment verification

2. **Monero Wallet RPC**
   - Manages marketplace wallet
   - Creates payment addresses
   - Processes incoming payments

### Setup Options

#### Option 1: Docker (Recommended for Development)
The Docker setup includes integrated Monero services:

```bash
# Includes monerod + wallet RPC automatically
docker-compose up -d
```

Services included:
- **monerod**: Testnet daemon for development
- **monero-wallet-rpc**: Pre-configured wallet
- **Automatic sync**: Services start together

#### Option 2: Manual Installation

1. **Install Monero**:
   ```bash
   # Ubuntu/Debian
   sudo apt update
   sudo apt install monero
   
   # macOS
   brew install monero
   
   # Or download from: https://getmonero.org/downloads/
   ```

2. **Start Monero Daemon**:
   ```bash
   # Testnet (development)
   monerod --testnet --rpc-bind-port=18081
   
   # Mainnet (production)
   monerod --rpc-bind-port=18081
   ```

3. **Start Wallet RPC**:
   ```bash
   # Testnet
   monero-wallet-rpc --testnet --rpc-bind-port=18083 --wallet-file=marketplace-wallet
   
   # Mainnet
   monero-wallet-rpc --rpc-bind-port=18083 --wallet-file=marketplace-wallet
   ```

### Environment Configuration

Update your `.env` file with Monero settings:

```env
# Monero Configuration - REQUIRED
MONERO_DAEMON_URL="http://localhost:18081"
MONERO_WALLET_RPC_URL="http://localhost:18083"
MONERO_WALLET_PASSWORD="your-secure-wallet-password"
```

### Testing Monero Connection

Verify your setup:

```bash
# Test daemon connection
curl http://localhost:18081/json_rpc -d '{"jsonrpc":"2.0","id":"0","method":"get_info"}' -H 'Content-Type: application/json'

# Test wallet RPC
curl http://localhost:18083/json_rpc -d '{"jsonrpc":"2.0","id":"0","method":"get_address"}' -H 'Content-Type: application/json'
```

### Production Considerations

#### Security
- **Secure wallet password**: Use strong, unique passwords
- **Firewall protection**: Limit RPC access to localhost
- **Regular backups**: Backup wallet files regularly
- **Hardware separation**: Consider dedicated Monero servers

#### Performance
- **SSD storage**: Monero blockchain requires fast storage
- **Adequate RAM**: 4GB+ recommended for smooth operation
- **Network bandwidth**: Initial sync requires significant bandwidth
- **Sync time**: First sync can take hours to days

#### Mainnet vs Testnet

**Development (Testnet)**:
```env
# Uses testnet XMR (worthless test coins)
MONERO_DAEMON_URL="http://localhost:18081"  # with --testnet flag
```

**Production (Mainnet)**:
```env
# Uses real XMR
MONERO_DAEMON_URL="http://localhost:18081"  # without --testnet flag
```

### Troubleshooting

#### Daemon Not Syncing
```bash
# Check sync status
curl http://localhost:18081/json_rpc -d '{"jsonrpc":"2.0","id":"0","method":"get_info"}' -H 'Content-Type: application/json'

# Look for "synchronized": true
```

#### Wallet RPC Issues
```bash
# Check wallet status
curl http://localhost:18083/json_rpc -d '{"jsonrpc":"2.0","id":"0","method":"get_balance"}' -H 'Content-Type: application/json'
```

#### Connection Errors
- Verify ports are not blocked
- Check if services are running
- Confirm environment variables are correct

### Integration with Storage Modes

#### Traditional Database Mode
```
Frontend → API → SQLite + QuickDB (product data)
              ↓
         Monero Services (payments)
```

#### ActivityPub Federation Mode
```
Frontend → API → ActivityPub Network (product data)
              ↓
         Monero Services (payments)
```

**In both modes**: Monero handles the payment layer while the chosen storage system handles product/user data.

### Why Not Optional?

Without Monero services:
- ❌ No payment processing
- ❌ Cannot verify transactions
- ❌ Free downloads only
- ❌ No revenue for developers
- ❌ Incomplete marketplace functionality

**Monero is the backbone of the payment system** - the marketplace cannot function as intended without it.

### Alternative Payment Methods

Currently, this marketplace is **Monero-only** by design for:
- Maximum privacy
- Decentralization
- Censorship resistance
- Global accessibility

Future versions might support additional cryptocurrencies, but Monero will remain the primary payment method.

---

**Remember**: Whether you choose database or ActivityPub storage, **Monero is required for payments**. Plan your infrastructure accordingly! 