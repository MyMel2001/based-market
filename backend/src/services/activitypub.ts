import express from 'express';
import { MongoClient, Db } from 'mongodb';
import ActivitypubExpress from 'activitypub-express';
import crypto from 'crypto';
import { env } from '../config/env';
import { prisma } from '../lib/prisma';
import { quickDBService } from './quickdb';

export interface ActivityPubUser {
  id: string;
  type: 'Person';
  preferredUsername: string;
  name: string;
  inbox: string;
  outbox: string;
  followers: string;
  following: string;
  publicKey: {
    id: string;
    owner: string;
    publicKeyPem: string;
  };
  email?: string;
  moneroAddress?: string;
  role: 'USER' | 'DEVELOPER' | 'ADMIN';
  createdAt: Date;
  updatedAt: Date;
}

export interface ActivityPubProduct {
  '@context'?: string | (string | object)[];
  id: string;
  type: 'Article';
  name: string;
  content: string;
  url: string;
  image?: string;
  price?: number; // in XMR
  category: string;
  tag: string[];
  productType: 'GAME' | 'APP';
  attributedTo: string; // developer ID
  published: Date;
  updated: Date;
  isActive: boolean;
  downloadCount: number;
}

export interface ActivityPubTransaction {
  '@context'?: string | (string | object)[];
  id: string;
  type: 'Purchase' | 'Payment';
  actor: string; // buyer ID
  object: string; // product ID
  target: string; // seller ID
  amount: number; // in XMR
  moneroTxHash?: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  published: Date;
  updated: Date;
}

class ActivityPubService {
  private apex: any;
  private db: Db | null = null;
  private mongoClient: MongoClient | null = null;
  private domain: string;
  private baseUrl: string;
  private initialized: boolean = false;

  constructor() {
    this.domain = env.ACTIVITYPUB_DOMAIN || 'localhost:3001';
    this.baseUrl = env.ACTIVITYPUB_BASE_URL || `http://${this.domain}`;
  }

  async initialize(): Promise<void> {
    // Connect to MongoDB for ActivityPub storage
    const mongoUrl = env.ACTIVITYPUB_MONGO_URL || 'mongodb://localhost:27017/basedmarket_activitypub';
    this.mongoClient = new MongoClient(mongoUrl);
    await this.mongoClient.connect();
    this.db = this.mongoClient.db();

    // Configure ActivityPub routes
    const routes = {
      actor: '/ap/u/:actor',
      object: '/ap/o/:id',
      activity: '/ap/s/:id',
      inbox: '/ap/u/:actor/inbox',
      outbox: '/ap/u/:actor/outbox',
      followers: '/ap/u/:actor/followers',
      following: '/ap/u/:actor/following',
      liked: '/ap/u/:actor/liked',
      collections: '/ap/u/:actor/c/:id',
      blocked: '/ap/u/:actor/blocked',
      rejections: '/ap/u/:actor/rejections',
      rejected: '/ap/u/:actor/rejected',
      shares: '/ap/s/:id/shares',
      likes: '/ap/s/:id/likes'
    };

    // Initialize ActivityPub Express
    this.apex = ActivitypubExpress({
      name: 'Based Games Marketplace',
      version: '1.0.0',
      domain: this.domain,
      baseUrl: this.baseUrl,
      actorParam: 'actor',
      objectParam: 'id',
      activityParam: 'id',
      routes,
      endpoints: {
        proxyUrl: `${this.baseUrl}/ap/proxy`
      },
      context: [
        'https://www.w3.org/ns/activitystreams',
        'https://w3id.org/security/v1',
        {
          'basedmarket': 'https://basedmarket.org/ns#',
          'moneroAddress': 'basedmarket:moneroAddress',
          'price': 'basedmarket:price',
          'downloadCount': 'basedmarket:downloadCount',
          'productType': 'basedmarket:productType',
          'moneroTxHash': 'basedmarket:moneroTxHash'
        }
      ]
    });

    // Set up database
    this.apex.store.db = this.db;
    await this.apex.store.setup();

    console.log('ActivityPub service initialized with decentralized storage');
  }

  // Create ActivityPub Actor from User data
  async createUser(userData: {
    username: string;
    email: string;
    password: string;
    role: 'USER' | 'DEVELOPER' | 'ADMIN';
    moneroAddress?: string;
  }): Promise<ActivityPubUser> {
    const actor = await this.apex.createActor(
      userData.username,
      userData.username,
      '', // summary
      userData.moneroAddress || null,
      'Person'
    );

    // Add custom properties
    const actorWithCustomProps = {
      ...actor,
      email: userData.email,
      role: userData.role,
      moneroAddress: userData.moneroAddress,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Store the actor
    await this.apex.store.saveObject(actorWithCustomProps);

    // Create initial activity announcing the user
    const createActivity = {
      '@context': 'https://www.w3.org/ns/activitystreams',
      type: 'Create',
      actor: actor.id,
      object: actorWithCustomProps,
      published: new Date().toISOString()
    };

    await this.apex.addToOutbox(actor, createActivity);

    return actorWithCustomProps as ActivityPubUser;
  }

  // Create ActivityPub Article from Product data
  async createProduct(productData: {
    title: string;
    description: string;
    productUrl: string;
    imageUrl?: string;
    price: number;
    category: string;
    tags: string[];
    type: 'GAME' | 'APP';
    developerId: string;
  }): Promise<ActivityPubProduct> {
    const developer = await this.getUser(productData.developerId);
    if (!developer) {
      throw new Error('Developer not found');
    }

    const productId = `${this.baseUrl}/ap/o/${crypto.randomUUID()}`;
    
    const product: ActivityPubProduct = {
      '@context': [
        'https://www.w3.org/ns/activitystreams',
        { 'basedmarket': 'https://basedmarket.org/ns#' }
      ],
      id: productId,
      type: 'Article',
      name: productData.title,
      content: productData.description,
      url: productData.productUrl,
      image: productData.imageUrl,
      price: productData.price,
      category: productData.category,
      tag: productData.tags,
      productType: productData.type,
      attributedTo: developer.id,
      published: new Date(),
      updated: new Date(),
      isActive: true,
      downloadCount: 0
    };

    // Store the product object
    await this.apex.store.saveObject(product);

    // Create activity announcing the product
    const createActivity = {
      '@context': 'https://www.w3.org/ns/activitystreams',
      type: 'Create',
      actor: developer.id,
      object: product,
      published: new Date().toISOString(),
      to: ['https://www.w3.org/ns/activitystreams#Public'],
      cc: [developer.followers]
    };

    // Add to developer's outbox and federate
    await this.apex.addToOutbox(developer, createActivity);

    return product;
  }

  // Create ActivityPub Purchase activity from Transaction data
  async createTransaction(transactionData: {
    productId: string;
    buyerId: string;
    sellerId: string;
    amount: number;
    moneroTxHash?: string;
  }): Promise<ActivityPubTransaction> {
    const [buyer, seller, product] = await Promise.all([
      this.getUser(transactionData.buyerId),
      this.getUser(transactionData.sellerId),
      this.getProduct(transactionData.productId)
    ]);

    if (!buyer || !seller || !product) {
      throw new Error('Required entities not found');
    }

    const transactionId = `${this.baseUrl}/ap/s/${crypto.randomUUID()}`;
    
    const transaction: ActivityPubTransaction = {
      '@context': [
        'https://www.w3.org/ns/activitystreams',
        { 'basedmarket': 'https://basedmarket.org/ns#' }
      ],
      id: transactionId,
      type: 'Purchase',
      actor: buyer.id,
      object: product.id,
      target: seller.id,
      amount: transactionData.amount,
      moneroTxHash: transactionData.moneroTxHash,
      status: 'PENDING',
      published: new Date(),
      updated: new Date()
    };

    // Store the transaction
    await this.apex.store.saveObject(transaction);

    // Create purchase activity
    const purchaseActivity = {
      '@context': 'https://www.w3.org/ns/activitystreams',
      type: 'Create',
      actor: buyer.id,
      object: transaction,
      published: new Date().toISOString(),
      to: [seller.id],
      cc: []
    };

    // Add to buyer's outbox and notify seller
    await this.apex.addToOutbox(buyer, purchaseActivity);

    return transaction;
  }

  // Get user by ID or username
  async getUser(identifier: string): Promise<ActivityPubUser | null> {
    try {
      let actor;
      
      if (identifier.startsWith('http')) {
        // Full ActivityPub ID
        actor = await this.apex.store.getObject(identifier);
      } else {
        // Username lookup
        const actorId = `${this.baseUrl}/ap/u/${identifier}`;
        actor = await this.apex.store.getObject(actorId);
      }

      return actor as ActivityPubUser;
    } catch (error) {
      console.error('Error getting user:', error);
      return null;
    }
  }

  // Get product by ID
  async getProduct(productId: string): Promise<ActivityPubProduct | null> {
    try {
      const product = await this.apex.store.getObject(productId);
      return product as ActivityPubProduct;
    } catch (error) {
      console.error('Error getting product:', error);
      return null;
    }
  }

  // Get all products with filtering
  async getProducts(filters: {
    category?: string;
    type?: 'GAME' | 'APP';
    developerId?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<ActivityPubProduct[]> {
    try {
      // Query the MongoDB collection directly for complex filtering
      if (!this.db) throw new Error('Database not initialized');

      const query: any = { type: 'Article' };
      
      if (filters.category) query.category = filters.category;
      if (filters.type) query.productType = filters.type;
      if (filters.developerId) query.attributedTo = filters.developerId;

      const products = await this.db.collection('objects')
        .find(query)
        .limit(filters.limit || 20)
        .skip(filters.offset || 0)
        .sort({ published: -1 })
        .toArray();

      return products as ActivityPubProduct[];
    } catch (error) {
      console.error('Error getting products:', error);
      return [];
    }
  }

  // Get transactions for a user
  async getUserTransactions(userId: string): Promise<ActivityPubTransaction[]> {
    try {
      if (!this.db) throw new Error('Database not initialized');

      const query = {
        $or: [
          { actor: userId, type: 'Purchase' },
          { target: userId, type: 'Purchase' }
        ]
      };

      const transactions = await this.db.collection('objects')
        .find(query)
        .sort({ published: -1 })
        .toArray();

      return transactions as ActivityPubTransaction[];
    } catch (error) {
      console.error('Error getting transactions:', error);
      return [];
    }
  }

  // Update transaction status
  async updateTransactionStatus(
    transactionId: string, 
    status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED',
    moneroTxHash?: string
  ): Promise<ActivityPubTransaction | null> {
    try {
      const transaction = await this.apex.store.getObject(transactionId) as ActivityPubTransaction;
      if (!transaction) return null;

      const updatedTransaction = {
        ...transaction,
        status,
        moneroTxHash: moneroTxHash || transaction.moneroTxHash,
        updated: new Date()
      };

      await this.apex.store.saveObject(updatedTransaction);

      // Create Update activity
      const updateActivity = {
        '@context': 'https://www.w3.org/ns/activitystreams',
        type: 'Update',
        actor: transaction.target, // seller updates the transaction
        object: updatedTransaction,
        published: new Date().toISOString(),
        to: [transaction.actor] // notify buyer
      };

      const seller = await this.getUser(transaction.target);
      if (seller) {
        await this.apex.addToOutbox(seller, updateActivity);
      }

      return updatedTransaction;
    } catch (error) {
      console.error('Error updating transaction:', error);
      return null;
    }
  }

  // Get the Express app with ActivityPub routes
  getExpressApp(): express.Application {
    const app = express();

    // Add ActivityPub middleware
    app.use(
      express.json({ type: this.apex.consts.jsonldTypes }),
      express.urlencoded({ extended: true }),
      this.apex
    );

    // Set up ActivityPub routes
    const routes = this.apex.routes;

    app.route(routes.inbox)
      .get(this.apex.net.inbox.get)
      .post(this.apex.net.inbox.post);
    
    app.route(routes.outbox)
      .get(this.apex.net.outbox.get)
      .post(this.apex.net.outbox.post);
    
    app.get(routes.actor, this.apex.net.actor.get);
    app.get(routes.followers, this.apex.net.followers.get);
    app.get(routes.following, this.apex.net.following.get);
    app.get(routes.liked, this.apex.net.liked.get);
    app.get(routes.object, this.apex.net.object.get);
    app.get(routes.activity, this.apex.net.activityStream.get);
    app.get(routes.shares, this.apex.net.shares.get);
    app.get(routes.likes, this.apex.net.likes.get);
    
    // WebFinger and NodeInfo
    app.get('/.well-known/webfinger', this.apex.net.webfinger.get);
    app.get('/.well-known/nodeinfo', this.apex.net.nodeInfoLocation.get);
    app.get('/nodeinfo/:version', this.apex.net.nodeInfo.get);
    app.post('/ap/proxy', this.apex.net.proxy.post);

    return app;
  }

  // Set up event handlers for federation
  setupEventHandlers(callback?: (type: string, data: any) => void): void {
    this.apex.on('apex-inbox', (msg: any) => {
      console.log(`Received ${msg.activity.type} from ${msg.actor} to ${msg.recipient}`);
      if (callback) callback('inbox', msg);
    });

    this.apex.on('apex-outbox', (msg: any) => {
      console.log(`Sent ${msg.activity.type} from ${msg.actor}`);
      if (callback) callback('outbox', msg);
    });
  }

  async close(): Promise<void> {
    this.initialized = false;
    console.log('ActivityPub service closed');
  }

  // SQLite-based storage methods
  private async ensureTables(): Promise<void> {
    // Create ActivityPub tables if they don't exist
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS activitypub_actors (
        id TEXT PRIMARY KEY,
        data TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;

    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS activitypub_objects (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        data TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;

    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS activitypub_activities (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        actor_id TEXT NOT NULL,
        object_id TEXT,
        data TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;

    console.log('ActivityPub SQLite tables ensured');
  }

  private async getActorFromSQLite(actorId: string): Promise<any> {
    try {
      // Try QuickDB cache first
      const cached = await quickDBService.getCachedActor(actorId);
      if (cached) return cached;

      // Query SQLite
      const result = await prisma.$queryRaw<Array<{data: string}>>`
        SELECT data FROM activitypub_actors WHERE id = ${actorId}
      `;

      if (result.length > 0) {
        const actor = JSON.parse(result[0].data);
        // Cache for 1 hour
        await quickDBService.setCachedActor(actorId, actor, 3600);
        return actor;
      }

      return null;
    } catch (error) {
      console.error('Error getting actor from SQLite:', error);
      return null;
    }
  }

  private async saveActorToSQLite(actor: any): Promise<void> {
    try {
      const actorData = JSON.stringify(actor);
      await prisma.$executeRaw`
        INSERT OR REPLACE INTO activitypub_actors (id, data, updated_at)
        VALUES (${actor.id}, ${actorData}, CURRENT_TIMESTAMP)
      `;

      // Update cache
      await quickDBService.setCachedActor(actor.id, actor, 3600);
    } catch (error) {
      console.error('Error saving actor to SQLite:', error);
      throw error;
    }
  }

  private async getObjectFromSQLite(objectId: string): Promise<any> {
    try {
      // Try QuickDB cache first
      const cached = await quickDBService.getCachedObject(objectId);
      if (cached) return cached;

      // Query SQLite
      const result = await prisma.$queryRaw<Array<{data: string}>>`
        SELECT data FROM activitypub_objects WHERE id = ${objectId}
      `;

      if (result.length > 0) {
        const object = JSON.parse(result[0].data);
        // Cache for 1 hour
        await quickDBService.setCachedObject(objectId, object, 3600);
        return object;
      }

      return null;
    } catch (error) {
      console.error('Error getting object from SQLite:', error);
      return null;
    }
  }

  private async saveObjectToSQLite(object: any): Promise<void> {
    try {
      const objectData = JSON.stringify(object);
      await prisma.$executeRaw`
        INSERT OR REPLACE INTO activitypub_objects (id, type, data, updated_at)
        VALUES (${object.id}, ${object.type || 'Object'}, ${objectData}, CURRENT_TIMESTAMP)
      `;

      // Update cache
      await quickDBService.setCachedObject(object.id, object, 3600);
    } catch (error) {
      console.error('Error saving object to SQLite:', error);
      throw error;
    }
  }

  private async getActivityFromSQLite(activityId: string): Promise<any> {
    try {
      // Query SQLite
      const result = await prisma.$queryRaw<Array<{data: string}>>`
        SELECT data FROM activitypub_activities WHERE id = ${activityId}
      `;

      if (result.length > 0) {
        return JSON.parse(result[0].data);
      }

      return null;
    } catch (error) {
      console.error('Error getting activity from SQLite:', error);
      return null;
    }
  }

  private async saveActivityToSQLite(activity: any): Promise<void> {
    try {
      const activityData = JSON.stringify(activity);
      await prisma.$executeRaw`
        INSERT OR REPLACE INTO activitypub_activities (id, type, actor_id, object_id, data)
        VALUES (
          ${activity.id},
          ${activity.type || 'Activity'},
          ${activity.actor || activity.actor?.id || ''},
          ${activity.object?.id || activity.object || ''},
          ${activityData}
        )
      `;
    } catch (error) {
      console.error('Error saving activity to SQLite:', error);
      throw error;
    }
  }
}

export const activityPubService = new ActivityPubService(); 