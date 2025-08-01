import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

// Environment variable validation schema
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).pipe(z.number().min(1).max(65535)).default('3001'),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters long'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  MONERO_DAEMON_URL: z.string().url().default('http://localhost:18081'),
  MONERO_WALLET_RPC_URL: z.string().url().default('http://localhost:18083'),
  MONERO_WALLET_PASSWORD: z.string().min(1),
  MARKETPLACE_FEE_RATE: z.string().transform(Number).pipe(z.number().min(0).max(1)).default('0.30'),
  INSTANCE_OWNER_MONERO_ADDRESS: z.string().optional(),
  FRONTEND_URL: z.string().url().default('http://localhost:3000'),
  CREATE_SAMPLE_DATA: z.string().transform(val => val === 'true').default('false'),
  ACTIVITYPUB_DOMAIN: z.string().min(1).default('localhost:3001'),
  ACTIVITYPUB_BASE_URL: z.string().url().default('http://localhost:3001'),
  STORAGE_MODE: z.enum(['database', 'activitypub']).default('activitypub'),
});

// Validate environment variables
const envValidation = envSchema.safeParse(process.env);

if (!envValidation.success) {
  console.error('❌ Environment validation failed:');
  envValidation.error.errors.forEach(error => {
    console.error(`  - ${error.path.join('.')}: ${error.message}`);
  });
  process.exit(1);
}

const validatedEnv = envValidation.data;

export const env = {
  // Server
  NODE_ENV: validatedEnv.NODE_ENV,
  PORT: validatedEnv.PORT,
  
  // Database
  DATABASE_URL: validatedEnv.DATABASE_URL,
  
  // JWT
  JWT_SECRET: validatedEnv.JWT_SECRET,
  JWT_EXPIRES_IN: validatedEnv.JWT_EXPIRES_IN,
  
  // Monero
  MONERO_DAEMON_URL: validatedEnv.MONERO_DAEMON_URL,
  MONERO_WALLET_RPC_URL: validatedEnv.MONERO_WALLET_RPC_URL,
  MONERO_WALLET_PASSWORD: validatedEnv.MONERO_WALLET_PASSWORD,
  
  // ActivityPub
  ACTIVITYPUB_MONGO_URL: process.env.ACTIVITYPUB_MONGO_URL || 'mongodb://localhost:27017/basedmarket_activitypub',
  
  // Marketplace Configuration
  MARKETPLACE_FEE_RATE: validatedEnv.MARKETPLACE_FEE_RATE,
  INSTANCE_OWNER_MONERO_ADDRESS: validatedEnv.INSTANCE_OWNER_MONERO_ADDRESS,
  
  // CORS
  FRONTEND_URL: validatedEnv.FRONTEND_URL,
  
  // Sample Data
  CREATE_SAMPLE_DATA: validatedEnv.CREATE_SAMPLE_DATA,

  // ActivityPub Configuration  
  ACTIVITYPUB_DOMAIN: validatedEnv.ACTIVITYPUB_DOMAIN,
  ACTIVITYPUB_BASE_URL: validatedEnv.ACTIVITYPUB_BASE_URL,
  
  // Storage Mode: 'database' for traditional DB, 'activitypub' for decentralized storage
  STORAGE_MODE: validatedEnv.STORAGE_MODE
} as const; 