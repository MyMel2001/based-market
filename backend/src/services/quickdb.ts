import { QuickDB } from 'quick.db';
import path from 'path';

// Initialize QuickDB for fast key-value operations
const dbPath = path.join(process.env.NODE_ENV === 'production' ? '/app/data' : process.cwd(), 'quickdb.sqlite');
const quickDB = new QuickDB({ filePath: dbPath });

export interface QuickDBService {
  // Cache operations
  setCache(key: string, value: any, ttl?: number): Promise<void>;
  getCache(key: string): Promise<any>;
  deleteCache(key: string): Promise<boolean>;
  clearCache(): Promise<void>;

  // Session storage
  setSession(sessionId: string, data: any): Promise<void>;
  getSession(sessionId: string): Promise<any>;
  deleteSession(sessionId: string): Promise<boolean>;

  // Rate limiting
  incrementRateLimit(key: string, window: number): Promise<number>;
  getRateLimit(key: string): Promise<number>;

  // Analytics/metrics
  incrementMetric(metric: string): Promise<number>;
  getMetric(metric: string): Promise<number>;
  setMetric(metric: string, value: number): Promise<void>;

  // ActivityPub federation cache
  setCachedActor(actorId: string, actorData: any, ttl?: number): Promise<void>;
  getCachedActor(actorId: string): Promise<any>;
  setCachedObject(objectId: string, objectData: any, ttl?: number): Promise<void>;
  getCachedObject(objectId: string): Promise<any>;
}

class QuickDBServiceImpl implements QuickDBService {
  private async setWithTTL(key: string, value: any, ttl?: number): Promise<void> {
    const data = {
      value,
      expires: ttl ? Date.now() + (ttl * 1000) : null
    };
    await quickDB.set(key, data);
  }

  private async getWithTTL(key: string): Promise<any> {
    const data = await quickDB.get(key);
    if (!data) return null;

    // Check if expired
    if (data.expires && Date.now() > data.expires) {
      await quickDB.delete(key);
      return null;
    }

    return data.value;
  }

  // Cache operations
  async setCache(key: string, value: any, ttl: number = 3600): Promise<void> {
    await this.setWithTTL(`cache:${key}`, value, ttl);
  }

  async getCache(key: string): Promise<any> {
    return await this.getWithTTL(`cache:${key}`);
  }

  async deleteCache(key: string): Promise<boolean> {
    const result = await quickDB.delete(`cache:${key}`);
    return result > 0;
  }

  async clearCache(): Promise<void> {
    const keys = await quickDB.all();
    for (const item of keys) {
      if (item.id.startsWith('cache:')) {
        await quickDB.delete(item.id);
      }
    }
  }

  // Session storage
  async setSession(sessionId: string, data: any): Promise<void> {
    await this.setWithTTL(`session:${sessionId}`, data, 86400); // 24 hour TTL
  }

  async getSession(sessionId: string): Promise<any> {
    return await this.getWithTTL(`session:${sessionId}`);
  }

  async deleteSession(sessionId: string): Promise<boolean> {
    const result = await quickDB.delete(`session:${sessionId}`);
    return result > 0;
  }

  // Rate limiting
  async incrementRateLimit(key: string, window: number): Promise<number> {
    const rateLimitKey = `ratelimit:${key}:${Math.floor(Date.now() / (window * 1000))}`;
    const current = await quickDB.get(rateLimitKey) || 0;
    const newValue = current + 1;
    await this.setWithTTL(rateLimitKey, newValue, window);
    return newValue;
  }

  async getRateLimit(key: string): Promise<number> {
    const rateLimitKey = `ratelimit:${key}:${Math.floor(Date.now() / 60000)}`; // 1 minute window
    return await quickDB.get(rateLimitKey) || 0;
  }

  // Analytics/metrics
  async incrementMetric(metric: string): Promise<number> {
    const key = `metric:${metric}`;
    const current = await quickDB.get(key) || 0;
    const newValue = current + 1;
    await quickDB.set(key, newValue);
    return newValue;
  }

  async getMetric(metric: string): Promise<number> {
    return await quickDB.get(`metric:${metric}`) || 0;
  }

  async setMetric(metric: string, value: number): Promise<void> {
    await quickDB.set(`metric:${metric}`, value);
  }

  // ActivityPub federation cache
  async setCachedActor(actorId: string, actorData: any, ttl: number = 3600): Promise<void> {
    await this.setWithTTL(`ap:actor:${actorId}`, actorData, ttl);
  }

  async getCachedActor(actorId: string): Promise<any> {
    return await this.getWithTTL(`ap:actor:${actorId}`);
  }

  async setCachedObject(objectId: string, objectData: any, ttl: number = 3600): Promise<void> {
    await this.setWithTTL(`ap:object:${objectId}`, objectData, ttl);
  }

  async getCachedObject(objectId: string): Promise<any> {
    return await this.getWithTTL(`ap:object:${objectId}`);
  }
}

// Export singleton instance
export const quickDBService = new QuickDBServiceImpl();

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('🔄 Closing QuickDB connection...');
  await quickDB.close();
});

process.on('SIGTERM', async () => {
  console.log('🔄 Closing QuickDB connection...');
  await quickDB.close();
});

// Export metrics helper
export const metrics = {
  // Product metrics
  incrementProductView: (productId: string) => quickDBService.incrementMetric(`product:${productId}:views`),
  incrementProductDownload: (productId: string) => quickDBService.incrementMetric(`product:${productId}:downloads`),
  
  // User metrics
  incrementUserRegistration: () => quickDBService.incrementMetric('users:registrations'),
  incrementUserLogin: () => quickDBService.incrementMetric('users:logins'),
  
  // Transaction metrics
  incrementTransaction: () => quickDBService.incrementMetric('transactions:total'),
  incrementTransactionValue: (amount: number) => quickDBService.incrementMetric(`transactions:value:${Math.floor(amount * 100)}`),
  
  // API metrics
  incrementAPICall: (endpoint: string) => quickDBService.incrementMetric(`api:${endpoint}`),
  
  // ActivityPub federation metrics
  incrementFederationInbound: () => quickDBService.incrementMetric('federation:inbound'),
  incrementFederationOutbound: () => quickDBService.incrementMetric('federation:outbound'),
  incrementActorDiscovery: () => quickDBService.incrementMetric('federation:actor_discovery'),
}; 