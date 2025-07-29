# Based Marketplace

A decentralized marketplace for games, apps, and media that accepts Monero payments, with revolutionary **ActivityPub-based decentralized storage** as an alternative to traditional databases.

## 🚀 Features

- **ActivityPub Federation** - Your marketplace federates with Mastodon and the fediverse
- **Decentralized Storage** - Use ActivityPub as a distributed database or traditional SQLite
- **Monero Payments** - Privacy-focused cryptocurrency transactions (required)
- **Multi-Product Support** - Sell games, apps, and media content
- **User Roles** - Developers, users, and administrators
- **JWT Authentication** - Secure user sessions
- **TypeScript** - Full type safety across the stack
- **Modern UI** - React with Tailwind CSS
- **Docker Ready** - One-command deployment with persistent Monero wallet
- **Production Ready** - SSL, monitoring, backups, and scaling support

## 🎯 Why ActivityPub + Monero?

**ActivityPub** provides true decentralization:
- Products federate to followers across the fediverse
- Users discoverable via WebFinger protocol  
- Transactions published as ActivityStreams
- Censorship-resistant marketplace

**Monero** ensures payment privacy:
- Private, untraceable transactions
- No central payment processor
- Global accessibility
- **Required for all payment processing**

**Perfect for**: Privacy-focused developers selling games, apps, and media to a decentralized audience.

## 🌐 Decentralized Storage with ActivityPub

This marketplace features a groundbreaking approach to data storage: **ActivityPub as a decentralized database**. Instead of relying on traditional centralized databases, your marketplace data can be stored and federated across the ActivityPub network (the same protocol powering Mastodon, Pleroma, and other fediverse platforms).

### How It Works

**Traditional Database Mode:**
```
User → API → SQLite → Response
```

**ActivityPub Federation Mode:**
```
User → API → ActivityPub Network → MongoDB (Local) + Federation → Response
```

In ActivityPub mode:
- **Users** become **ActivityPub Actors** (discoverable via WebFinger)
- **Products** (games, apps, media) become **ActivityStreams Articles** (federated content)
- **Transactions** become **Purchase Activities** (distributed across the network)
- **Your marketplace** becomes a **federated ActivityPub instance**

### Data Model Mapping

| Traditional Database | ActivityPub Object | Federation Benefit |
|---------------------|-------------------|-------------------|
| User | Actor (Person) | Discoverable across fediverse |
| Product (Game/App/Media) | Article | Appears in federated timelines |
| Transaction | Purchase Activity | Transparent, distributed ledger |
| Follows | Follow Activity | Cross-platform relationships |

### Benefits of ActivityPub Storage

1. **🌍 True Decentralization**: No single point of failure
2. **🔍 Built-in Discovery**: Games, apps, and media discoverable via WebFinger and fediverse search
3. **📡 Automatic Federation**: Content replicates across friendly instances
4. **🕸️ Network Effects**: Tap into existing fediverse audience
5. **🔒 Censorship Resistance**: Distributed data across multiple servers
6. **🔄 Real-time Updates**: ActivityStreams provide live notifications
7. **📊 Transparent Transactions**: Public audit trail via activities

### Federation Features

✅ **User Federation**: Users can be followed from Mastodon/Pleroma
✅ **Product Discovery**: Games, apps, and media appear in fediverse timelines
✅ **Cross-platform Notifications**: Purchase confirmations federate
✅ **Distributed Following**: Build audience across instances
✅ **WebFinger Support**: `user@yourdomain.com` discovery
✅ **NodeInfo Compliance**: Instance metadata sharing
✅ **ActivityStreams Protocol**: Full specification compliance

## 🚀 Quick Start

### Prerequisites

Choose your storage mode:

**Traditional Database Mode:**
- SQLite (included with Node.js)
- Node.js 18+
- Monero daemon (monerod) - **Required for payments**

**ActivityPub Federation Mode:**
- MongoDB 5+
- Node.js 18+
- Monero daemon (monerod) - **Required for payments**
- A public domain (for federation)

### Installation

```bash
git clone https://github.com/your-repo/based-market
cd based-market
npm install
```

### Configuration

Copy the environment file:
```bash
cp backend/env.example backend/.env
```

**For Traditional Database:**
```env
STORAGE_MODE="database"
DATABASE_URL="file:./marketplace.db"
```

**For ActivityPub Federation:**
```env
STORAGE_MODE="activitypub"
ACTIVITYPUB_DOMAIN="yourdomain.com"
ACTIVITYPUB_BASE_URL="https://yourdomain.com"
ACTIVITYPUB_MONGO_URL="mongodb://localhost:27017/marketplace_federation"
```

### Setup

**Traditional Database:**
```bash
cd backend
npm run db:push
npm run db:seed  # optional sample data
npm run dev
```

**ActivityPub Federation:**
```bash
cd backend
npm run activitypub:setup  # initializes federation
npm run dev
```

**Docker (ActivityPub + Persistent Monero):**
```bash
# Start all services with ActivityPub federation
docker-compose up -d

# Initialize ActivityPub federation
docker-compose exec backend npm run activitypub:setup

# Access at http://localhost:3000
```

## 🔧 ActivityPub Configuration

### 1. Domain Setup

For federation to work, you need a public domain:

```env
ACTIVITYPUB_DOMAIN="marketplace.example.com"
ACTIVITYPUB_BASE_URL="https://marketplace.example.com"
```

### 2. MongoDB Setup

ActivityPub uses MongoDB for object storage:

```env
ACTIVITYPUB_MONGO_URL="mongodb://localhost:27017/marketplace_ap"
```

### 3. Federation Setup

Run the setup script:

```bash
npm run activitypub:setup
```

This creates:
- System and marketplace actors
- MongoDB collections
- Federation endpoints
- WebFinger configuration

### 4. Testing Federation

Test your setup:

```bash
# Test WebFinger discovery
curl "https://yourdomain.com/.well-known/webfinger?resource=acct:marketplace@yourdomain.com"

# Test NodeInfo
curl "https://yourdomain.com/.well-known/nodeinfo"

# Test marketplace actor
curl "https://yourdomain.com/ap/u/marketplace"
```

### 5. Discover from Mastodon

From any Mastodon instance, search for:
```
@marketplace@yourdomain.com
```

Your marketplace should appear as a followable account!

## 🏗️ Architecture

### Traditional Mode
```
Frontend ↔ API ↔ SQLite (+ QuickDB cache)
                ↕
            Monero Daemon
          (Payment Processing)
```

### ActivityPub Mode
```
Frontend ↔ API ↔ ActivityPub Service ↔ MongoDB
                           ↕
                   Fediverse Network
                  (Mastodon, Pleroma, etc.)
                           ↕
                    Monero Daemon
                  (Payment Processing)
```

### Storage Abstraction

The codebase uses a storage abstraction layer:

```typescript
// Works with both modes
await storageService.createUser(userData);
await storageService.getProducts(filters);
await storageService.createTransaction(txData);
```

Under the hood:
- **Database mode**: SQLite with Prisma ORM + QuickDB for caching/metrics
- **ActivityPub mode**: SQLite + QuickDB + ActivityStreams federation

## 📡 Federation Examples

### Product Publishing

When a developer creates a product (game, app, or media):

**Traditional Database:**
```sql
-- SQLite with Prisma ORM
INSERT INTO products (title, description, ...) VALUES (...)
```

**ActivityPub Federation:**
```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "Create",
  "actor": "https://yourdomain.com/ap/u/developer",
  "object": {
    "type": "Article",
    "name": "Awesome Game",
    "content": "A revolutionary new game...",
    "url": "https://cdn.example.com/awesome-game",
    "price": 0.1,
    "category": "games"
  },
  "to": ["https://www.w3.org/ns/activitystreams#Public"]
}
```

This activity gets federated to all followers across the fediverse!

### Transaction Recording

When someone purchases a product:

```json
{
  "@context": "https://www.w3.org/ns/activitystreams",
  "type": "Purchase",
  "actor": "https://yourdomain.com/ap/u/buyer",
  "object": "https://yourdomain.com/ap/o/product-123",
  "target": "https://yourdomain.com/ap/u/seller",
  "amount": 0.1,
  "moneroTxHash": "abc123..."
}
```

### User Discovery

Users can be discovered and followed:

```bash
# From Mastodon, search for:
@alice@yourmarketplace.com

# View their profile and recent product purchases/sales
```

## 🌍 Federation Benefits

### For Users
- **Cross-platform Identity**: One account works across fediverse
- **Social Discovery**: Find games, apps, and media through social connections
- **Privacy Control**: Choose which instances to federate with
- **Data Ownership**: Your data exists on multiple servers

### For Developers
- **Built-in Marketing**: Products appear in federated timelines
- **Instant Audience**: Tap into existing fediverse users
- **Transparent Sales**: Public transaction history builds trust
- **Network Effects**: Followers from any ActivityPub platform

### For Marketplace Operators
- **Reduced Infrastructure**: Leverage federated storage
- **Natural Discovery**: Search engines index ActivityPub content
- **Community Building**: Foster cross-instance relationships
- **Censorship Resistance**: Distributed operation model

## 🔄 Migration Between Modes

You can switch between storage modes:

### Database → ActivityPub
```bash
# Export existing data
npm run export:database

# Switch mode
STORAGE_MODE="activitypub"

# Import to ActivityPub
npm run import:activitypub
```

### ActivityPub → Database
```bash
# Export federation data  
npm run export:activitypub

# Switch mode
STORAGE_MODE="database"

# Import to database
npm run import:database
```

## 🔗 Federation Network

When you choose ActivityPub mode, your marketplace joins a global network:

```
🏪 Your Marketplace
       ↕ ️
🌐 Fediverse Network
   ├── 🐘 Mastodon Instances
   ├── 🦆 Pleroma Instances  
   ├── 🎭 Other ActivityPub Apps
   └── 🏪 Other Marketplaces
```

Users can:
- Follow developers from Mastodon
- See new products (games, apps, media) in their timeline
- Share and boost products
- Interact across platforms

## 🚨 Important Considerations

### Public by Default
ActivityPub data is **public by default**. Consider:
- User emails are stored locally, not federated
- Product descriptions become public content
- Transaction amounts are visible (Monero hashes are private)
- Use private activities for sensitive operations

### Domain Stability
Once federated, changing domains is difficult:
- Federation relies on stable actor URLs
- Consider long-term domain strategy
- Test thoroughly on subdomains first

### Storage Requirements
- **Database mode**: SQLite file storage (lightweight, no server required)
- **ActivityPub mode**: SQLite + QuickDB + federation bandwidth (same file!)
- **Hybrid**: Run both modes simultaneously (unified SQLite storage)

### Performance
- **Database mode**: SQLite with QuickDB caching (very fast, local file)
- **ActivityPub mode**: SQLite + QuickDB + federation (fast local, network for federation)
- **Both modes**: Monero daemon required for payment processing
- **Unified SQLite**: Single database file for everything, no server required

## 🧪 Development

### Running Tests
```bash
# Test both storage modes
npm test

# Test federation specifically  
npm run test:federation

# Test ActivityPub compliance
npm run test:activitypub
```

### Debug Federation
```bash
# Enable ActivityPub debug logs
DEBUG=activitypub:* npm run dev

# Monitor federation traffic
npm run monitor:federation
```

## 📚 Learn More

- [ActivityPub Specification](https://www.w3.org/TR/activitypub/)
- [ActivityStreams Vocabulary](https://www.w3.org/TR/activitystreams-vocabulary/)
- [Mastodon API Compatibility](https://docs.joinmastodon.org/api/)
- [Federation Best Practices](https://socialhub.activitypub.rocks/)

## 🤝 Contributing

We welcome contributions to both storage modes:

1. **Database improvements**: SQL optimizations, new features
2. **Federation enhancements**: ActivityPub compliance, new activity types
3. **Storage abstraction**: Better compatibility layer
4. **Documentation**: Federation guides, examples

## 📄 License

MIT License - Build the decentralized future! 

---

**Ready to revolutionize digital marketplaces with ActivityPub?** 🚀

Choose your path:
- 💾 **Traditional**: `STORAGE_MODE="database"` 
- 🌐 **Revolutionary**: `STORAGE_MODE="activitypub"`

*The future of commerce is federated.* 