import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

export const env = {
  // Server
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '3001'),
  
  // Database
  DATABASE_URL: process.env.DATABASE_URL || 'file:./marketplace.db',
  
  // JWT
  JWT_SECRET: process.env.JWT_SECRET || 'fallback-secret-key',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  
  // Monero
  MONERO_DAEMON_URL: process.env.MONERO_DAEMON_URL || 'http://localhost:18081',
  MONERO_WALLET_RPC_URL: process.env.MONERO_WALLET_RPC_URL || 'http://localhost:18083',
  
  // ActivityPub
  ACTIVITYPUB_MONGO_URL: process.env.ACTIVITYPUB_MONGO_URL || 'mongodb://localhost:27017/basedmarket_activitypub',
  MONERO_WALLET_PASSWORD: process.env.MONERO_WALLET_PASSWORD || '',
  
  // Marketplace Configuration
  MARKETPLACE_FEE_RATE: parseFloat(process.env.MARKETPLACE_FEE_RATE || '0.30'), // 30% default
  INSTANCE_OWNER_MONERO_ADDRESS: process.env.INSTANCE_OWNER_MONERO_ADDRESS || '',
  
  // CORS
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
  
  // Sample Data
  CREATE_SAMPLE_DATA: process.env.CREATE_SAMPLE_DATA === 'true',

  // ActivityPub Configuration  
  ACTIVITYPUB_DOMAIN: process.env.ACTIVITYPUB_DOMAIN || 'localhost:3001',
  ACTIVITYPUB_BASE_URL: process.env.ACTIVITYPUB_BASE_URL || 'http://localhost:3001',
  
  // Storage Mode: 'database' for traditional DB, 'activitypub' for decentralized storage
  STORAGE_MODE: process.env.STORAGE_MODE || 'activitypub'
} as const; 