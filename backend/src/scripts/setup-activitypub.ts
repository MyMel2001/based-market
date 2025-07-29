#!/usr/bin/env tsx

/**
 * ActivityPub Setup Script
 * 
 * This script helps initialize your marketplace for ActivityPub federation.
 * It creates the necessary MongoDB collections and sets up initial system actors.
 */

import { activityPubService } from '../services/activitypub';
import { env } from '../config/env';

async function setupActivityPub() {
  console.log('🚀 Setting up ActivityPub federation...');
  
  try {
    // Initialize the ActivityPub service
    await activityPubService.initialize();
    console.log('✅ ActivityPub service initialized');

    // Create a system actor for signing requests
    const systemActor = await activityPubService.createUser({
      username: 'system',
      email: 'system@' + env.ACTIVITYPUB_DOMAIN,
      password: 'system', // Not used in federation
      role: 'ADMIN'
    });
    
    console.log('✅ System actor created:', systemActor.id);

    // Create a marketplace actor to represent the instance
    const marketplaceActor = await activityPubService.createUser({
      username: 'marketplace',
      email: 'marketplace@' + env.ACTIVITYPUB_DOMAIN,
      password: 'marketplace', // Not used in federation
      role: 'ADMIN'
    });

    console.log('✅ Marketplace actor created:', marketplaceActor.id);

    console.log('\n🌐 ActivityPub Federation Setup Complete!');
    console.log('\nYour marketplace is now federated and discoverable via:');
    console.log(`🔗 WebFinger: ${env.ACTIVITYPUB_BASE_URL}/.well-known/webfinger?resource=acct:marketplace@${env.ACTIVITYPUB_DOMAIN}`);
    console.log(`📄 NodeInfo: ${env.ACTIVITYPUB_BASE_URL}/.well-known/nodeinfo`);
    console.log(`👤 Marketplace Actor: ${env.ACTIVITYPUB_BASE_URL}/ap/u/marketplace`);
    
    console.log('\n🔧 Next steps:');
    console.log('1. Set STORAGE_MODE="activitypub" in your .env file');
    console.log('2. Start your server with: npm run dev');
    console.log('3. Test federation by searching for marketplace@' + env.ACTIVITYPUB_DOMAIN + ' from Mastodon');
    console.log('4. Products (games, apps, media) created by developers will be federated as Articles');
    console.log('5. Transactions will be published as Purchase activities');
    console.log('6. Ensure Monero daemon is running for payment processing');

  } catch (error) {
    console.error('❌ Failed to setup ActivityPub:', error);
    process.exit(1);
  } finally {
    await activityPubService.close();
    console.log('\n✨ Setup complete. You can now start your federated marketplace!');
    process.exit(0);
  }
}

// Show help information
function showHelp() {
  console.log(`
🌐 ActivityPub Federation Setup for Based Games Marketplace

This script sets up your marketplace for decentralized federation using ActivityPub.

BEFORE RUNNING:
1. Make sure MongoDB is running (required for ActivityPub storage)
2. Set these environment variables:
   - ACTIVITYPUB_DOMAIN (your public domain)
   - ACTIVITYPUB_BASE_URL (your public URL)
   - ACTIVITYPUB_MONGO_URL (MongoDB connection string)

USAGE:
  npm run activitypub:setup
  tsx src/scripts/setup-activitypub.ts

WHAT THIS DOES:
- Creates MongoDB collections for ActivityPub objects
- Sets up system and marketplace actors
- Configures federation endpoints
- Enables WebFinger discovery

FEDERATION FEATURES:
✅ Users as Actors (discoverable via WebFinger)
✅ Products as Articles (federated content)
✅ Transactions as Purchase Activities
✅ Following/Follower relationships
✅ Public timeline for product announcements
✅ ActivityStreams protocol compliance

Your marketplace will then be discoverable by:
- Mastodon and other ActivityPub servers
- Fediverse search engines
- ActivityPub client applications

Products (games, apps, media) published by developers will appear in:
- Public timelines of followers
- Federated timelines across instances
- ActivityPub-compatible readers

For more information, see: https://www.w3.org/TR/activitypub/
`);
}

// Check command line arguments
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  showHelp();
  process.exit(0);
}

// Validate environment
if (env.STORAGE_MODE !== 'activitypub') {
  console.error('❌ STORAGE_MODE must be set to "activitypub" for federation setup');
  console.log('Set STORAGE_MODE="activitypub" in your .env file and try again.');
  process.exit(1);
}

if (!env.ACTIVITYPUB_DOMAIN || !env.ACTIVITYPUB_BASE_URL) {
  console.error('❌ ActivityPub configuration missing');
  console.log('Please set ACTIVITYPUB_DOMAIN and ACTIVITYPUB_BASE_URL in your .env file');
  process.exit(1);
}

// Run setup
setupActivityPub(); 