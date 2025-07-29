import { env } from '../config/env';
import { activityPubService, ActivityPubUser, ActivityPubProduct, ActivityPubTransaction } from './activitypub';
import { PrismaClient } from '@prisma/client';
import { User, Product, Transaction } from 'shared';
import { quickDBService, metrics } from './quickdb';

// Storage interface for different backends
interface StorageInterface {
  // User operations
  createUser(userData: any): Promise<any>;
  getUserById(id: string): Promise<any | null>;
  getUserByEmail(email: string): Promise<any | null>;
  getUserByUsername(username: string): Promise<any | null>;
  updateUser(id: string, data: any): Promise<any | null>;

  // Product operations
  createProduct(productData: any): Promise<any>;
  getProductById(id: string): Promise<any | null>;
  getProducts(filters: any): Promise<any[]>;
  updateProduct(id: string, data: any): Promise<any | null>;
  deleteProduct(id: string): Promise<boolean>;

  // Transaction operations
  createTransaction(transactionData: any): Promise<any>;
  getTransactionById(id: string): Promise<any | null>;
  getUserTransactions(userId: string): Promise<any[]>;
  updateTransaction(id: string, data: any): Promise<any | null>;

  // Initialize storage
  initialize(): Promise<void>;
  close(): Promise<void>;
}

// Traditional Prisma database storage
class DatabaseStorage implements StorageInterface {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async initialize(): Promise<void> {
    // Prisma connection is automatic for SQLite
    console.log('SQLite database storage initialized');
    
    // Test database connection
    try {
      await this.prisma.$connect();
      console.log('✅ SQLite database connected successfully');
    } catch (error) {
      console.error('❌ Failed to connect to SQLite database:', error);
      throw error;
    }
  }

  async close(): Promise<void> {
    await this.prisma.$disconnect();
  }

  // User operations
  async createUser(userData: {
    email: string;
    username: string;
    password: string;
    role: 'USER' | 'DEVELOPER' | 'ADMIN';
    moneroAddress?: string;
  }): Promise<User> {
    const user = await this.prisma.user.create({
      data: userData
    });
    
    // Track metrics
    await metrics.incrementUserRegistration();
    
    return user;
  }

  async getUserById(id: string): Promise<User | null> {
    // Try cache first
    const cacheKey = `user:${id}`;
    const cachedUser = await quickDBService.getCache(cacheKey);
    if (cachedUser) {
      return cachedUser;
    }
    
    const user = await this.prisma.user.findUnique({
      where: { id }
    });
    
    // Cache for 5 minutes
    if (user) {
      await quickDBService.setCache(cacheKey, user, 300);
    }
    
    return user;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    return await this.prisma.user.findUnique({
      where: { email }
    });
  }

  async getUserByUsername(username: string): Promise<User | null> {
    return await this.prisma.user.findUnique({
      where: { username }
    });
  }

  async updateUser(id: string, data: any): Promise<User | null> {
    return await this.prisma.user.update({
      where: { id },
      data
    });
  }

  // Product operations
  async createProduct(productData: any): Promise<Product> {
    const product = await this.prisma.product.create({
      data: productData,
      include: {
        developer: true
      }
    });
    
    // Clear relevant caches
    await quickDBService.deleteCache('products:list');
    await quickDBService.deleteCache(`products:developer:${productData.developerId}`);
    
    return product;
  }

  async getProductById(id: string): Promise<Product | null> {
    return await this.prisma.product.findUnique({
      where: { id },
      include: {
        developer: true
      }
    });
  }

  async getProducts(filters: any): Promise<Product[]> {
    const { category, type, search, sortBy = 'createdAt', sortOrder = 'desc', limit = 20, offset = 0 } = filters;
    
    const where: any = { isActive: true };
    if (category) where.category = category;
    if (type) where.type = type;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    return await this.prisma.product.findMany({
      where,
      include: {
        developer: true
      },
      orderBy: { [sortBy]: sortOrder },
      take: limit,
      skip: offset
    });
  }

  async updateProduct(id: string, data: any): Promise<Product | null> {
    return await this.prisma.product.update({
      where: { id },
      data,
      include: {
        developer: true
      }
    });
  }

  async deleteProduct(id: string): Promise<boolean> {
    try {
      await this.prisma.product.delete({
        where: { id }
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  // Transaction operations
  async createTransaction(transactionData: any): Promise<Transaction> {
    return await this.prisma.transaction.create({
      data: transactionData,
      include: {
        product: true,
        buyer: true,
        seller: true
      }
    });
  }

  async getTransactionById(id: string): Promise<Transaction | null> {
    return await this.prisma.transaction.findUnique({
      where: { id },
      include: {
        product: true,
        buyer: true,
        seller: true
      }
    });
  }

  async getUserTransactions(userId: string): Promise<Transaction[]> {
    return await this.prisma.transaction.findMany({
      where: {
        OR: [
          { buyerId: userId },
          { sellerId: userId }
        ]
      },
      include: {
        product: true,
        buyer: true,
        seller: true
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async updateTransaction(id: string, data: any): Promise<Transaction | null> {
    return await this.prisma.transaction.update({
      where: { id },
      data,
      include: {
        product: true,
        buyer: true,
        seller: true
      }
    });
  }
}

// ActivityPub decentralized storage
class ActivityPubStorage implements StorageInterface {
  async initialize(): Promise<void> {
    await activityPubService.initialize();
  }

  async close(): Promise<void> {
    await activityPubService.close();
  }

  // Convert ActivityPub objects to traditional format for API compatibility
  private convertApUserToUser(apUser: ActivityPubUser): User {
    return {
      id: this.extractIdFromUrl(apUser.id),
      email: apUser.email || '',
      username: apUser.preferredUsername,
      role: apUser.role,
      moneroAddress: apUser.moneroAddress,
      createdAt: apUser.createdAt,
      updatedAt: apUser.updatedAt
    };
  }

  private convertApProductToProduct(apProduct: ActivityPubProduct): Product {
    return {
      id: this.extractIdFromUrl(apProduct.id),
      title: apProduct.name,
      description: apProduct.content,
      productUrl: apProduct.url,
      imageUrl: apProduct.image,
      price: apProduct.price || 0,
      category: apProduct.category,
      tags: apProduct.tag,
      type: apProduct.productType,
      developerId: this.extractIdFromUrl(apProduct.attributedTo),
      developer: {} as User, // Will be populated separately
      isActive: apProduct.isActive,
      downloadCount: apProduct.downloadCount,
      createdAt: apProduct.published,
      updatedAt: apProduct.updated
    };
  }

  private convertApTransactionToTransaction(apTransaction: ActivityPubTransaction): Transaction {
    return {
      id: this.extractIdFromUrl(apTransaction.id),
      productId: this.extractIdFromUrl(apTransaction.object),
      buyerId: this.extractIdFromUrl(apTransaction.actor),
      sellerId: this.extractIdFromUrl(apTransaction.target),
      amount: apTransaction.amount,
      moneroTxHash: apTransaction.moneroTxHash,
      status: apTransaction.status,
      createdAt: apTransaction.published,
      updatedAt: apTransaction.updated
    };
  }

  private extractIdFromUrl(url: string): string {
    // Extract the last part of the URL as the ID
    return url.split('/').pop() || url;
  }

  private createFullUrl(baseUrl: string, id: string): string {
    return `${baseUrl}/${id}`;
  }

  // User operations
  async createUser(userData: {
    email: string;
    username: string;
    password: string;
    role: 'USER' | 'DEVELOPER' | 'ADMIN';
    moneroAddress?: string;
  }): Promise<User> {
    const apUser = await activityPubService.createUser(userData);
    return this.convertApUserToUser(apUser);
  }

  async getUserById(id: string): Promise<User | null> {
    const apUser = await activityPubService.getUser(id);
    return apUser ? this.convertApUserToUser(apUser) : null;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    // Note: ActivityPub doesn't have direct email lookup, would need custom indexing
    // For now, we'll implement a workaround by searching through all users
    // In a real implementation, you'd want to add custom indexing
    console.warn('getUserByEmail in ActivityPub storage requires custom indexing');
    return null;
  }

  async getUserByUsername(username: string): Promise<User | null> {
    const apUser = await activityPubService.getUser(username);
    return apUser ? this.convertApUserToUser(apUser) : null;
  }

  async updateUser(id: string, data: any): Promise<User | null> {
    // ActivityPub updates would involve creating Update activities
    // For now, we'll implement a simplified version
    console.warn('updateUser in ActivityPub storage not fully implemented');
    return null;
  }

  // Product operations
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
  }): Promise<Product> {
    const apProduct = await activityPubService.createProduct(productData);
    const product = this.convertApProductToProduct(apProduct);
    
    // Get developer info
    const developer = await this.getUserById(product.developerId);
    if (developer) {
      product.developer = developer;
    }
    
    return product;
  }

  async getProductById(id: string): Promise<Product | null> {
    const fullUrl = this.createFullUrl(env.ACTIVITYPUB_BASE_URL + '/ap/o', id);
    const apProduct = await activityPubService.getProduct(fullUrl);
    
    if (!apProduct) return null;
    
    const product = this.convertApProductToProduct(apProduct);
    
    // Get developer info
    const developer = await this.getUserById(product.developerId);
    if (developer) {
      product.developer = developer;
    }
    
    return product;
  }

  async getProducts(filters: {
    category?: string;
    type?: 'GAME' | 'APP';
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    limit?: number;
    offset?: number;
  }): Promise<Product[]> {
    const apProducts = await activityPubService.getProducts({
      category: filters.category,
      type: filters.type,
      limit: filters.limit,
      offset: filters.offset
    });

    const products = await Promise.all(
      apProducts.map(async (apProduct) => {
        const product = this.convertApProductToProduct(apProduct);
        
        // Get developer info
        const developer = await this.getUserById(product.developerId);
        if (developer) {
          product.developer = developer;
        }
        
        return product;
      })
    );

    return products;
  }

  async updateProduct(id: string, data: any): Promise<Product | null> {
    // Would involve creating Update activities in ActivityPub
    console.warn('updateProduct in ActivityPub storage not fully implemented');
    return null;
  }

  async deleteProduct(id: string): Promise<boolean> {
    // Would involve creating Delete activities in ActivityPub
    console.warn('deleteProduct in ActivityPub storage not fully implemented');
    return false;
  }

  // Transaction operations
  async createTransaction(transactionData: {
    productId: string;
    buyerId: string;
    sellerId: string;
    amount: number;
    moneroTxHash?: string;
  }): Promise<Transaction> {
    // Convert IDs to full URLs for ActivityPub
    const fullProductId = this.createFullUrl(env.ACTIVITYPUB_BASE_URL + '/ap/o', transactionData.productId);
    const fullBuyerId = this.createFullUrl(env.ACTIVITYPUB_BASE_URL + '/ap/u', transactionData.buyerId);
    const fullSellerId = this.createFullUrl(env.ACTIVITYPUB_BASE_URL + '/ap/u', transactionData.sellerId);

    const apTransaction = await activityPubService.createTransaction({
      productId: fullProductId,
      buyerId: fullBuyerId,
      sellerId: fullSellerId,
      amount: transactionData.amount,
      moneroTxHash: transactionData.moneroTxHash
    });

    return this.convertApTransactionToTransaction(apTransaction);
  }

  async getTransactionById(id: string): Promise<Transaction | null> {
    const fullUrl = this.createFullUrl(env.ACTIVITYPUB_BASE_URL + '/ap/s', id);
    // Would need to implement transaction retrieval in ActivityPub service
    console.warn('getTransactionById in ActivityPub storage not fully implemented');
    return null;
  }

  async getUserTransactions(userId: string): Promise<Transaction[]> {
    const fullUserId = this.createFullUrl(env.ACTIVITYPUB_BASE_URL + '/ap/u', userId);
    const apTransactions = await activityPubService.getUserTransactions(fullUserId);
    
    return apTransactions.map(apTransaction => 
      this.convertApTransactionToTransaction(apTransaction)
    );
  }

  async updateTransaction(id: string, data: any): Promise<Transaction | null> {
    if (data.status || data.moneroTxHash) {
      const fullUrl = this.createFullUrl(env.ACTIVITYPUB_BASE_URL + '/ap/s', id);
      const apTransaction = await activityPubService.updateTransactionStatus(
        fullUrl,
        data.status,
        data.moneroTxHash
      );
      
      return apTransaction ? this.convertApTransactionToTransaction(apTransaction) : null;
    }
    
    return null;
  }
}

// Factory function to create the appropriate storage implementation
function createStorageService(): StorageInterface {
  if (env.STORAGE_MODE === 'activitypub') {
    return new ActivityPubStorage();
  } else {
    return new DatabaseStorage();
  }
}

// Export the storage service instance
export const storageService = createStorageService(); 