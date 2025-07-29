import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { env } from './config/env';
import { storageService } from './services/storage';
import { activityPubService } from './services/activitypub';

// Import routes
import authRoutes from './routes/auth';
import gamesRoutes from './routes/games';
import paymentsRoutes from './routes/payments';
import feesRoutes from './routes/fees';

const app = express();

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: env.FRONTEND_URL,
  credentials: true,
}));
app.use(morgan('combined'));
app.use(limiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Initialize storage service
async function initializeServices() {
  try {
    await storageService.initialize();
    console.log(`✅ Storage service initialized (mode: ${env.STORAGE_MODE})`);
    
    if (env.STORAGE_MODE === 'activitypub') {
      // Set up ActivityPub event handlers for federation
      activityPubService.setupEventHandlers((type, data) => {
        console.log(`📡 ActivityPub ${type}:`, {
          activity: data.activity?.type,
          actor: data.actor,
          object: data.object?.type
        });
      });
      
      // Mount ActivityPub routes
      app.use('/', activityPubService.getExpressApp());
      console.log('✅ ActivityPub federation endpoints mounted');
    }
  } catch (error) {
    console.error('❌ Failed to initialize services:', error);
    process.exit(1);
  }
}

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/games', gamesRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/fees', feesRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    storage: env.STORAGE_MODE,
    federation: env.STORAGE_MODE === 'activitypub' ? 'enabled' : 'disabled'
  });
});

// ActivityPub discovery endpoints (always enabled for compatibility)
app.get('/.well-known/webfinger', (req, res, next) => {
  if (env.STORAGE_MODE === 'activitypub') {
    // Forward to ActivityPub service
    next();
  } else {
    res.status(404).json({ error: 'WebFinger not available in database mode' });
  }
});

app.get('/.well-known/nodeinfo', (req, res, next) => {
  if (env.STORAGE_MODE === 'activitypub') {
    // Forward to ActivityPub service
    next();
  } else {
    res.json({
      links: [{
        rel: 'http://nodeinfo.diaspora.software/ns/schema/2.0',
        href: `${env.ACTIVITYPUB_BASE_URL}/nodeinfo/2.0`
      }]
    });
  }
});

// NodeInfo endpoint for federation discovery
app.get('/nodeinfo/:version', (req, res) => {
  if (env.STORAGE_MODE !== 'activitypub') {
    return res.json({
      version: req.params.version,
      software: {
        name: 'Based Games Marketplace',
        version: '1.0.0'
      },
      protocols: [],
      services: {
        inbound: [],
        outbound: []
      },
      usage: {
        users: {
          total: 0,
          activeMonth: 0,
          activeHalfyear: 0
        },
        localPosts: 0
      },
      openRegistrations: false,
             metadata: {
         features: ['marketplace', 'games', 'apps', 'media', 'monero-payments'],
         federation: false
       }
    });
  }
  // In ActivityPub mode, this is handled by the ActivityPub service
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('❌ Unhandled error:', err);

  // Handle ActivityPub-specific errors
  if (err.name === 'ActivityPubError') {
    return res.status(err.status || 500).json({
      error: 'ActivityPub Error',
      message: err.message
    });
  }

  if (env.NODE_ENV === 'development') {
    res.status(500).json({
      error: err.message,
      stack: err.stack,
    });
  } else {
    res.status(500).json({
      error: 'Internal server error',
    });
  }
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🔄 Shutting down gracefully...');
  
  try {
    await storageService.close();
    console.log('✅ Storage service closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
});

process.on('SIGTERM', async () => {
  console.log('🔄 SIGTERM received, shutting down gracefully...');
  
  try {
    await storageService.close();
    console.log('✅ Storage service closed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
});

// Start server
async function startServer() {
  await initializeServices();
  
  const port = env.PORT || 3001;
  app.listen(port, () => {
    console.log(`🚀 Server running on port ${port}`);
    console.log(`📦 Storage mode: ${env.STORAGE_MODE}`);
    
    if (env.STORAGE_MODE === 'activitypub') {
      console.log(`🌐 ActivityPub federation enabled`);
      console.log(`🔗 Federation domain: ${env.ACTIVITYPUB_DOMAIN}`);
      console.log(`📡 WebFinger: ${env.ACTIVITYPUB_BASE_URL}/.well-known/webfinger`);
      console.log(`📄 NodeInfo: ${env.ACTIVITYPUB_BASE_URL}/.well-known/nodeinfo`);
    } else {
      console.log(`💾 Traditional database mode`);
    }
    
    console.log(`🏠 Frontend URL: ${env.FRONTEND_URL}`);
    console.log(`⚡ Environment: ${env.NODE_ENV}`);
  });
}

startServer().catch((error) => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
}); 