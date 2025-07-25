import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3001),
  DATABASE_URL: z.string(),
  JWT_SECRET: z.string(),
  JWT_EXPIRES_IN: z.string().default('7d'),
  FRONTEND_URL: z.string().default('http://localhost:3000'),
  MONERO_DAEMON_URL: z.string().default('http://localhost:18081'),
  MONERO_WALLET_RPC_URL: z.string().default('http://localhost:18083'),
  MONERO_WALLET_PASSWORD: z.string().optional(),
});

const envResult = envSchema.safeParse(process.env);

if (!envResult.success) {
  console.error('❌ Invalid environment variables:', envResult.error.format());
  process.exit(1);
}

export const env = envResult.data; 