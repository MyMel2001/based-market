# Based Marketplace

A modern online marketplace for indie games and applications with Monero cryptocurrency payments. Developers can list their games/apps (hosted on their own servers) and users can purchase them with Monero or download them for free.

**Start clean** - The marketplace begins with an empty database, ready for real developers and users to join!

## 🪙 Integrated Monero Services

The marketplace includes **fully integrated Monero services** via Docker:

- **🔗 Monero Daemon (monerod)**: Testnet node for development
- **💳 Monero Wallet RPC**: Pre-configured wallet for payment processing  
- **⚡ Zero Setup**: Start developing with Monero payments immediately
- **🧪 Testnet Mode**: Safe testing environment with testnet XMR

**First-time setup**: Monero services automatically sync on startup (may take 5-10 minutes).

## 🎮 Features

### For Users
- **Browse Products**: Discover indie games and apps with advanced filtering and search
- **Monero Payments**: Secure cryptocurrency transactions (testnet for development)
- **Free Products**: Download free games and apps instantly
- **User Dashboard**: Track purchases and product library
- **Modern UI**: Beautiful, responsive design with Tailwind CSS

### For Developers
- **List Products**: Add your games and apps with descriptions, images, and pricing
- **External Hosting**: Link to your own servers
- **Monero Integration**: Receive payments directly to your wallet
- **Developer Dashboard**: Manage your products and track sales
- **No Platform Lock-in**: Your products remain on your servers

### Technical Features
- **Full-Stack TypeScript**: Type safety throughout the application
- **Modern Architecture**: React + Express + PostgreSQL + Prisma
- **Cryptocurrency Support**: Integrated Monero daemon and wallet RPC
- **Docker Support**: Complete development environment with one command
- **RESTful API**: Clean, documented API endpoints
- **Authentication**: JWT-based secure authentication
- **Real-time Updates**: React Query for efficient data fetching

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Database      │
│   (React +      │◄──►│   (Express +    │◄──►│   (PostgreSQL)  │
│   TypeScript)   │    │   TypeScript)   │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Shared Types  │    │   Monero        │    │   Prisma ORM    │
│   (TypeScript)  │    │   Integration   │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL database
- Docker and Docker Compose (optional)

### Option 1: Docker Development (Recommended)

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd based-games-marketplace
   ```

2. **Configure environment (optional)**
   ```bash
   # Copy and customize Docker environment file if needed
   cp docker.env .env.docker.local
   # Edit .env.docker.local for local customization
   ```

3. **Start with Docker Compose**
   ```bash
   docker-compose up -d
   ```

4. **Initialize the database**
   ```bash
   # Run database migrations
   docker-compose exec backend npm run db:migrate
   ```

5. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001
   - Database Admin: http://localhost:8080
   - Monero Daemon RPC: http://localhost:18081
   - Monero Wallet RPC: http://localhost:18083

**Note**: Monero services may take a few minutes to fully synchronize on first start.

### Option 2: Manual Setup

1. **Install dependencies**
   ```bash
   npm install
   npm run build --workspace=shared
   npm install --workspace=backend
   npm install --workspace=frontend
   ```

2. **Set up the database**
   ```bash
   # Create PostgreSQL database
   createdb based_games_marketplace
   
   # Copy environment files
   cp backend/env.example backend/.env
   # Edit backend/.env with your database credentials
   ```

3. **Initialize the database**
   ```bash
   cd backend
   npm run db:migrate
   ```

4. **Start the development servers**
   ```bash
   # Terminal 1: Start backend
   npm run dev:backend
   
   # Terminal 2: Start frontend
   npm run dev:frontend
   ```

## 🔧 Configuration

### Docker Environment Configuration

The `docker.env` file contains all environment variables for Docker Compose:

```env
# Database Configuration
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=based_games_marketplace

# Backend Configuration
NODE_ENV=development
PORT=3001
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/based_games_marketplace?schema=public
JWT_SECRET=dev-jwt-secret-key-change-in-production
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:3000

# Monero Configuration (Docker services)
MONERO_DAEMON_URL=http://monerod:18081
MONERO_WALLET_RPC_URL=http://monero-wallet-rpc:18083
MONERO_WALLET_PASSWORD=dev-wallet-password

# Sample Data (optional)
CREATE_SAMPLE_DATA=false

# Frontend Configuration
VITE_API_URL=http://localhost:3001/api
```

**For local customization:**
```bash
# Copy the example file
cp docker.env.example .env.docker.local
# Edit .env.docker.local for your local environment
```

Then update your docker-compose command:
```bash
# Use local override file
cp .env.docker.local docker.env
docker-compose up -d
```

### Backend Environment Variables (for manual setup)
Create `backend/.env` with:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/based_games_marketplace?schema=public"

# JWT
JWT_SECRET="your-super-secret-jwt-key-here"
JWT_EXPIRES_IN="7d"

# Server
PORT=3001
NODE_ENV="development"

# Monero (optional for development)
MONERO_DAEMON_URL="http://localhost:18081"
MONERO_WALLET_RPC_URL="http://localhost:18083"
MONERO_WALLET_PASSWORD="your-wallet-password"

# CORS
FRONTEND_URL="http://localhost:3000"

# Sample Data (optional - for testing only)
CREATE_SAMPLE_DATA="false"
```

### Monero Integration

The Docker setup includes **testnet Monero services** for development:

- **Monero Daemon**: Automatically starts with testnet configuration
- **Monero Wallet RPC**: Pre-configured wallet for testing payments
- **Development-ready**: No manual Monero setup required!

**For production Monero setup:**

1. **Update docker-compose.yml** to use mainnet:
   ```yaml
   # Remove --testnet flag from monerod and monero-wallet-rpc commands
   ```

2. **Secure configuration**:
   ```bash
   # Update environment variables
   MONERO_WALLET_PASSWORD="secure-production-password"
   ```

3. **External Monero services** (recommended for production):
   ```bash
   # Use external Monero daemon and wallet RPC
   MONERO_DAEMON_URL="http://your-monero-node:18081"
   MONERO_WALLET_RPC_URL="http://your-wallet-rpc:18083"
   ```

## 📊 Database Schema

### Users
- Authentication and profile information
- Role-based access (USER, DEVELOPER, ADMIN)
- Monero wallet addresses for developers

### Products
- Product listings with metadata (games and apps)
- External URLs to product servers
- Pricing in Monero (0 for free products)
- Categories, tags, and product types (GAME/APP)

### Transactions
- Payment records and status
- Monero transaction hashes
- Download tracking

## 🔐 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Products (Games & Apps)
- `GET /api/games` - List products with filters (supports type=GAME|APP)
- `GET /api/games/:id` - Get product details
- `POST /api/games` - Create product (developers only)
- `PUT /api/games/:id` - Update product
- `DELETE /api/games/:id` - Delete product
- `GET /api/games/my/products` - Get developer's products

### Payments
- `POST /api/payments/create` - Create payment intent (accepts productId or gameId)
- `POST /api/payments/verify` - Verify Monero payment
- `POST /api/payments/free-download` - Download free product
- `GET /api/payments/my-transactions` - User transaction history

## 🧪 Testing with Sample Data (Optional)

The marketplace starts with a clean database. For testing purposes, you can optionally create sample data:

```bash
# Set environment variable to enable sample data
export CREATE_SAMPLE_DATA=true

# Run the seed script
npm run db:seed --workspace=backend

# Or with Docker
docker-compose exec backend sh -c "CREATE_SAMPLE_DATA=true npm run db:seed"
```

**Sample credentials (only when CREATE_SAMPLE_DATA=true):**
```
Admin: admin@basedgames.com / admin123
Developer 1: dev1@example.com / dev123
Developer 2: dev2@example.com / dev123
User: gamer@example.com / user123
```

## 🔧 Troubleshooting

### Monero Services
```bash
# Check Monero daemon status
curl http://localhost:18081/json_rpc -d '{"jsonrpc":"2.0","id":"0","method":"get_info"}' -H 'Content-Type: application/json'

# Check wallet RPC status  
curl http://localhost:18083/json_rpc -d '{"jsonrpc":"2.0","id":"0","method":"get_address"}' -H 'Content-Type: application/json'

# View Monero logs
docker-compose logs monerod
docker-compose logs monero-wallet-rpc
```

### Reset Monero Data
```bash
# Stop services and remove Monero data volumes
docker-compose down
docker volume rm based-games_monerod_data based-games_wallet_data
docker-compose up -d
```

## 🛠️ Development

### Project Structure
```
based-games-marketplace/
├── frontend/          # React TypeScript frontend
├── backend/           # Express TypeScript API
├── shared/            # Shared TypeScript types
├── docker.env         # Docker environment configuration
├── docker.env.example # Example Docker environment file
├── docker-compose.yml # Docker development setup
└── README.md         # This file
```

### Available Scripts

**Root level:**
- `npm run dev` - Start both frontend and backend
- `npm run build` - Build all packages
- `npm run db:migrate` - Run database migrations
- `npm run db:seed` - Create sample data (optional, requires CREATE_SAMPLE_DATA=true)

**Frontend:**
- `npm run dev --workspace=frontend` - Start frontend dev server
- `npm run build --workspace=frontend` - Build frontend

**Backend:**
- `npm run dev --workspace=backend` - Start backend dev server
- `npm run build --workspace=backend` - Build backend

### Adding New Features

1. **Update shared types** in `shared/src/types.ts`
2. **Add API endpoints** in `backend/src/routes/`
3. **Update database schema** with Prisma migrations
4. **Add frontend components** in `frontend/src/components/`
5. **Update API services** in `frontend/src/services/api.ts`

## 🚢 Deployment

### Production Setup

1. **Build all packages**
   ```bash
   npm run build
   ```

2. **Set production environment variables**
   ```bash
   NODE_ENV=production
   JWT_SECRET="strong-random-secret"
   DATABASE_URL="your-production-db-url"
   ```

3. **Run database migrations**
   ```bash
   npm run db:migrate --workspace=backend
   ```

4. **Start the production server**
   ```bash
   npm start
   ```

### Docker Production
```bash
# Build production images
docker-compose -f docker-compose.prod.yml build

# Deploy
docker-compose -f docker-compose.prod.yml up -d
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Monero](https://www.getmonero.org/) - Privacy-focused cryptocurrency
- [Prisma](https://www.prisma.io/) - Database toolkit
- [React](https://reactjs.org/) - Frontend framework
- [Express](https://expressjs.com/) - Backend framework
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework

## 🆘 Support

If you encounter any issues:

1. Check the [Issues](https://github.com/your-repo/issues) page
2. Review the environment configuration
3. Ensure all dependencies are installed
4. Check Docker logs: `docker-compose logs`

For development questions, please open an issue with:
- Node.js version
- Operating system
- Error messages
- Steps to reproduce

---

**Happy Gaming! 🎮✨** 