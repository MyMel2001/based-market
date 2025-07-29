#!/usr/bin/env tsx

/**
 * Migration Script: PostgreSQL to SQLite
 * 
 * This script helps migrate data from PostgreSQL to SQLite.
 * Use this if you're switching from an existing PostgreSQL setup.
 */

import { PrismaClient as PostgreSQLClient } from '@prisma/client';
import { PrismaClient as SQLiteClient } from '@prisma/client';
import { env } from '../config/env';

async function migrateToSQLite() {
  console.log('🔄 Starting PostgreSQL to SQLite migration...');

  // Check if we have a PostgreSQL URL to migrate from
  const postgresUrl = process.env.POSTGRES_DATABASE_URL;
  if (!postgresUrl) {
    console.error('❌ Please set POSTGRES_DATABASE_URL environment variable');
    console.log('Example: POSTGRES_DATABASE_URL="postgresql://user:pass@localhost:5432/marketplace"');
    process.exit(1);
  }

  const postgresClient = new PostgreSQLClient({
    datasources: {
      db: {
        url: postgresUrl
      }
    }
  });

  const sqliteClient = new SQLiteClient({
    datasources: {
      db: {
        url: env.DATABASE_URL // Should be SQLite file path
      }
    }
  });

  try {
    console.log('📡 Connecting to PostgreSQL...');
    await postgresClient.$connect();

    console.log('📁 Connecting to SQLite...');
    await sqliteClient.$connect();

    // Migrate Users
    console.log('👥 Migrating users...');
    const users = await postgresClient.user.findMany();
    console.log(`Found ${users.length} users to migrate`);

    for (const user of users) {
      await sqliteClient.user.create({
        data: {
          id: user.id,
          email: user.email,
          username: user.username,
          password: user.password,
          role: user.role,
          moneroAddress: user.moneroAddress,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        }
      });
    }
    console.log('✅ Users migrated successfully');

    // Migrate Products
    console.log('🎮 Migrating products...');
    const products = await postgresClient.product.findMany();
    console.log(`Found ${products.length} products to migrate`);

    for (const product of products) {
      await sqliteClient.product.create({
        data: {
          id: product.id,
          title: product.title,
          description: product.description,
          productUrl: product.productUrl,
          imageUrl: product.imageUrl,
          price: product.price,
          category: product.category,
          tags: product.tags,
          type: product.type,
          developerId: product.developerId,
          isActive: product.isActive,
          downloadCount: product.downloadCount,
          createdAt: product.createdAt,
          updatedAt: product.updatedAt
        }
      });
    }
    console.log('✅ Products migrated successfully');

    // Migrate Transactions
    console.log('💰 Migrating transactions...');
    const transactions = await postgresClient.transaction.findMany();
    console.log(`Found ${transactions.length} transactions to migrate`);

    for (const transaction of transactions) {
      await sqliteClient.transaction.create({
        data: {
          id: transaction.id,
          productId: transaction.productId,
          buyerId: transaction.buyerId,
          sellerId: transaction.sellerId,
          amount: transaction.amount,
          moneroTxHash: transaction.moneroTxHash,
          status: transaction.status,
          createdAt: transaction.createdAt,
          updatedAt: transaction.updatedAt
        }
      });
    }
    console.log('✅ Transactions migrated successfully');

    console.log('\n🎉 Migration completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`✅ ${users.length} users migrated`);
    console.log(`✅ ${products.length} products migrated`);
    console.log(`✅ ${transactions.length} transactions migrated`);

    console.log('\n🔧 Next steps:');
    console.log('1. Update your .env file to use SQLite:');
    console.log(`   DATABASE_URL="${env.DATABASE_URL}"`);
    console.log('2. Remove PostgreSQL connection string');
    console.log('3. Test your application with the new SQLite database');
    console.log('4. Backup your new SQLite database file');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await postgresClient.$disconnect();
    await sqliteClient.$disconnect();
  }
}

// Helper function to show usage
function showHelp() {
  console.log(`
🔄 PostgreSQL to SQLite Migration Tool

This script migrates your marketplace data from PostgreSQL to SQLite.

USAGE:
  POSTGRES_DATABASE_URL="postgresql://user:pass@host:5432/db" npm run migrate:sqlite

BEFORE RUNNING:
1. Backup your PostgreSQL database
2. Ensure SQLite database is initialized (npm run db:push)
3. Set POSTGRES_DATABASE_URL environment variable

EXAMPLE:
  POSTGRES_DATABASE_URL="postgresql://postgres:password@localhost:5432/marketplace" \\
  npm run migrate:sqlite

The script will:
✅ Export all users, products, and transactions
✅ Import them into your SQLite database
✅ Preserve all IDs and relationships
✅ Maintain data integrity

Your PostgreSQL database will remain unchanged.
`);
}

// Check command line arguments
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  showHelp();
  process.exit(0);
}

// Validate environment
if (!process.env.POSTGRES_DATABASE_URL) {
  console.error('❌ POSTGRES_DATABASE_URL environment variable required');
  console.log('\nSet it like this:');
  console.log('POSTGRES_DATABASE_URL="postgresql://user:pass@localhost:5432/marketplace" npm run migrate:sqlite');
  console.log('\nOr run with --help for more information');
  process.exit(1);
}

if (!env.DATABASE_URL.includes('file:')) {
  console.error('❌ DATABASE_URL must be a SQLite file path');
  console.log('Current DATABASE_URL:', env.DATABASE_URL);
  console.log('Expected format: file:./marketplace.db');
  process.exit(1);
}

// Run migration
migrateToSQLite(); 